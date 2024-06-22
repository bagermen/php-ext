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
# 	if [ $1 = "pkgs" ]; then
# 		echo "required packaged"
# 		return
# 	fi

# 	if [ $1 = "pkgs-dev" ]; then
# 		echo "packages to build"
# 		return
# 	fi

# 	if [ $1 = "pkgs-local" ]; then
# 		echo "local-package-name1 local-package-name2"
# 		return
# 	fi

# 	if [ $1 = "pkgs-local-remove" ]; then
# 		echo "local-package-name1 local-package-name2"
# 		return
# 	fi

# 	if [ $1 = "php-configure" ]; then
# 		docker-php-ext-configure
# 		return
# 	fi

# 	if [ $1 = "php-install" ]; then
# 		echo "php extension to install with docker-php-ext-install"
# 		return
# 	fi

# 	if [ $1 = "manual-install" ]; then
# 		manual installation
# 		return
# 	fi
# }

gd_ext()
{
	if [ $1 = "pkgs" ]; then
		echo "libsodium23 libfreetype6 libjpeg62-turbo libpng16-16"
		return
	fi

	if [ $1 = "pkgs-dev" ]; then
		echo " libsodium-dev libfreetype-dev libjpeg62-turbo-dev libpng-dev"
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
		echo "gettext libicu67"
		return
	fi

	if [ $1 = "pkgs-dev" ]; then
		echo "libicu-dev"
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
		echo "zip libzip4"
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
		echo "libpq5"
		return
	fi

	if [ $1 = "pkgs-dev" ]; then
		echo "libpq-dev"
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
		echo "libmemcachedutil2 zlib1g libsasl2-2"
		return
	fi

	if [ $1 = "pkgs-dev" ]; then
		echo "libmemcached-dev zlib1g-dev libsasl2-dev"
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
		# headers are included into debian image already
		# echo "linux-libc-dev"
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
	# Ensure apt is in non-interactive to avoid prompts
	export DEBIAN_FRONTEND=noninteractive

	local package_list="$@ \
		$PHPIZE_DEPS"

	# Install the list of packages
	echo "Packages to verify are installed: ${package_list}"
	rm -rf /var/lib/apt/lists/*
	apt-get update -y
	apt-get -y install --no-install-recommends ${package_list}

	# Get to latest versions of all packages
	if [ "${UPGRADE_PACKAGES}" = "true" ]; then
		apt-get -y upgrade --no-install-recommends
		apt-get autoremove -y
	fi
}

install_local_packages() {
	local list=$(echo "$@" | sed -e "s,[[:space:]\n]\+, ,g" -e "s,^[[:space:]]\+\|[[:space:]]\+$,,g")

	if [ -z "$list" ]; then
		echo "No local packages for installation"
		return
	fi

	local package_list=$(echo "$list" | sed -e "s,\([^[:space:]]\+\),$LOCAL_PKG_DIR/\1,g")

	echo "Packages to verify are installed: ${package_list}"

	for package in $package_list; do
		eval "dpkg -i $package"
	done

	apt-get install -f
}

remove_packages() {
	 # Ensure apt is in non-interactive to avoid prompts
	export DEBIAN_FRONTEND=noninteractive

	local package_list="$@"

	echo "Packages to verify are removed: ${package_list}"
	# Remove the list of packages
	apt-get -y remove --no-install-recommends ${package_list}
	apt-get autoremove -y

	# Clean up
	apt-get -y clean
	rm -rf /var/lib/apt/lists/*
}

# Actual package installation

echo "Packages installation.."
pkgs=""
for func in $func_list; do
	pkgs="${pkgs} $($func pkgs)"
	pkgs="${pkgs} $($func pkgs-dev)"
done

install_packages "$pkgs"

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

pkgs=""
for func in $func_list; do
	pkgs="${pkgs} $($func pkgs-dev)"
	pkgs="${pkgs} $($func pkgs-local-remove)"
done

echo "System cleanup.."
remove_packages "$pkgs"

echo "DONE.."
