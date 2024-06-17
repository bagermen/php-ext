#!/bin/sh

set -e

if [ "$(id -u)" -ne 0 ]; then
    echo -e 'Script must be run as root. Use sudo, su, or add "USER root" to your Dockerfile before running this script.'
    exit 1
fi

EXT_PACKAGES=${1:?}
LOCAL_PKG_DIR=${2:-"/tmp/tools/pkgs"}
UPGRADE_PACKAGES=${3:-"false"}

####
## Packages: gd intl zip soap pdo pdo_pgsql pdo_mysql mysqli bcmath opcache igbinary memcached redis xdebug
####

# convert package names to function names
func_list=$(echo $EXT_PACKAGES | sed -e 's/\([^[:space:]]\+\)/\1_ext/g')

#####
## Template function (most important things are: install-list, install)
#####
# example_ext()
# {
#     if [ $1 = "pkgs" ]; then
#         echo "required packaged"
#         return
#     fi

#     if [ $1 = "pkgs-dev" ]; then
#         echo "packages to build"
#         return
#     fi

#     if [ $1 = "pkgs-local" ]; then
#         echo "local-package-name1 local-package-name2"
#         return
#     fi

#     if [ $1 = "pkgs-local-remove" ]; then
#         echo "local-package-name1 local-package-name2"
#         return
#     fi

#     if [ $1 = "php-configure" ]; then
#         docker-php-ext-configure
#         return
#     fi

#     if [ $1 = "php-install" ]; then
#         echo "php extension to install with docker-php-ext-install"
#         return
#     fi

#     if [ $1 = "manual-install" ]; then
#         manual installation
#         return
#     fi
# }

gd_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "libsodium freetype libjpeg-turbo libpng"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "libsodium-dev freetype-dev libjpeg-turbo-dev libpng-dev"
        return
    fi

    if [ $1 = "php-configure" ]; then
        docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/
        return
    fi

    if [ $1 = "php-install" ]; then
        echo "gd"
        return
    fi
}

intl_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "libintl icu-libs"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "icu-dev"
        return
    fi

    if [ $1 = "php-install" ]; then
        echo "intl"
        return
    fi
}

zip_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "zip libzip"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "libzip-dev"
        return
    fi

    if [ $1 = "php-install" ]; then
        echo "zip"
        return
    fi
}

soap_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "libxml2"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "libxml2-dev"
        return
    fi

    if [ $1 = "php-install" ]; then
        echo "soap"
        return
    fi
}

pdo_ext()
{
    if [ $1 = "php-install" ]; then
        echo "pdo"
        return
    fi
}

pdo_pgsql_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "libpq"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "libpq-dev"
        # postgresql-dev
        return
    fi

    if [ $1 = "php-install" ]; then
        echo "pdo_pgsql"
        return
    fi
}

pdo_mysql_ext()
{
    if [ $1 = "php-install" ]; then
        echo "pdo_mysql"
        return
    fi
}

mysqli_ext()
{
    if [ $1 = "php-install" ]; then
        echo "mysqli"
        return
    fi
}

bcmath_ext()
{
    if [ $1 = "php-install" ]; then
        echo "bcmath"
        return
    fi
}

opcache_ext()
{
    if [ $1 = "php-install" ]; then
        echo "opcache"
        return
    fi
}

igbinary_ext()
{
    if [ $1 = "manual-install" ]; then
        pecl install igbinary
        docker-php-ext-enable igbinary
        return
    fi
}

memcached_ext()
{
    if [ $1 = "pkgs" ]; then
        echo "libmemcached-libs zlib libsasl"
        return
    fi

    if [ $1 = "pkgs-dev" ]; then
        echo "libmemcached-dev zlib-dev cyrus-sasl-dev"
        return
    fi

    if [ $1 = "manual-install" ]; then
        (
            pecl install --nobuild memcached
            cd "$(pecl config-get temp_dir)/memcached"
            phpize
            ./configure --enable-memcached-igbinary
            make -j$(nproc)
            make install
        )
        docker-php-ext-enable memcached
        return
    fi
}

redis_ext()
{
    if [ $1 = "manual-install" ]; then
        (
            pecl install --nobuild redis
            cd "$(pecl config-get temp_dir)/redis"
            phpize
            ./configure --enable-redis-igbinary
            make -j$(nproc)
            make install
        )
        docker-php-ext-enable redis
        return
    fi
}

xdebug_ext()
{
    if [ $1 = "pkgs-dev" ]; then
        echo "linux-headers"
        return
    fi

    if [ $1 = "manual-install" ]; then
        pecl install xdebug
        docker-php-ext-enable xdebug

        echo "xdebug.client_host=host.docker.internal" >> ${PHP_INI_DIR}/conf.d/docker-php-ext-xdebug.ini
        echo "xdebug.mode=develop,debug" >> ${PHP_INI_DIR}/conf.d/docker-php-ext-xdebug.ini
        return
    fi
}

install_packages() {
    if [ -z "$@" ]; then
        echo "No local packages for installation"
        return
    fi

    local package_list="$@"

    # Install the list of packages
    echo "Packages to verify are installed: ${package_list}"
    eval "apk add --update --no-cache $package_list"

    # Get to latest versions of all packages
    if [ "${UPGRADE_PACKAGES}" = "true" ]; then
        apk upgrade -a
    fi
}

install_dev_packages() {
    local package_list="$@ \
        $PHPIZE_DEPS"

    # Install the list of packages
    echo "Packages to verify are installed: ${package_list}"
    eval "apk add --no-cache --update --virtual .dev_packages $package_list"
}

install_local_packages() {
    local list= "$(echo "$@" | sed -e "s,[[:space:]\n]\+, ,g" -e "s,^[[:space:]]\+\|[[:space:]]\+$,,g")"

    if [ -z "$list" ]; then
        echo "No local packages for installation"
        return
    fi

    local package_list=$(echo "$list" | sed -e "s,\([^[:space:]]\+\),$LOCAL_PKG_DIR/\1,g")

    echo "Packages to verify are installed: ${package_list}"

    touch repo.list
    eval "apk add --repositories-file=repo.list --allow-untrusted --no-network --no-cache $package_list"
}

remove_dev_packages() {
    apk del .dev_packages
}

remove_packages() {
    local list=$(echo "$@" | sed -e "s,[[:space:]\n]\+, ,g" -e "s,^[[:space:]]\+\|[[:space:]]\+$,,g")

    if [ -z "$list" ]; then
        return
    fi

    apk del $list
}

# Actual package installation

echo "Packages installation.."
pkgs=""
for func in $func_list; do
    pkgs="${pkgs} $($func pkgs)"
done
install_packages "$pkgs"

pkgs=""
for func in $func_list; do
    pkgs="${pkgs} $($func pkgs-dev)"
done

install_dev_packages "$pkgs"

echo "Local packages installation.."
local_pkgs=""
for func in $func_list; do
    local_pkgs="${local_pkgs} $($func pkgs-local)"
done

install_local_packages "$local_pkgs"

echo "Packages configuration.."
for func in $func_list; do
    echo "configuration: $(echo "$func" | sed -n "s/\([^[:space:]]\+\)/\1_ext/g")"
    $func php-configure
done

install_list=""
for func in $func_list; do
    install_list="${install_list} $($func php-install)"
done

if [ -n "$install_list" ]; then
    echo "PHP packages installation.."

    echo "docker-php-ext-install -j\"$(nproc)\" $install_list"
    docker-php-ext-install -j"$(nproc)" $install_list
fi

for func in $func_list; do
    echo "Manual installation of $(echo "$func" | sed -n 's/\(.\+\)_ext/\1/p')"
    $func manual-install
done

echo "System cleanup.."
pkgs=""
for func in $func_list; do
    pkgs="${pkgs} $($func pkgs-local-remove)"
done

remove_packages "$pkgs"

remove_dev_packages

echo "DONE.."