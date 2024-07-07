# PHP-EXT
Repository which builds images from official **PHP-FPM** images with some popular extensions and pushes results to Github and Dockerhub.

The main idea is to provide such PHP images that could be close to official builds and could be used as is when running popular fromeworks like Sympfony or Laravel.

Images could be found at
* [docker.io/besogon1/php](https://hub.docker.com/repository/docker/besogon1/php)
* ghcr.io/bagermen/php

Images could be verified by GitHub CLI:
```powershell
gh at verify oci://docker.io/besogon1/php --owner bagermen
gh at verify oci://ghcr.io/bagermen/php --owner bagermen
```

## Extensions List
* bcmath
* gd
* igbinary
* intl
* memcached
* mysqli
* opcache
* pdo
* pdo_mysql
* pdo_pgsql
* redis
* soap
* xdebug
* zip

## Usage
Details and Usage: https://github.com/bagermen/apache-php-docker

## Contributing
We are happy if you want to create a pull request or help people with their issues. If you want to create a PR, please remember that this stack is not built for production usage, and changes should good for general purpose and not overspecialized.

Thank you!
