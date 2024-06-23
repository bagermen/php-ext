# php-ext
PHP images with extensions
11

https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases
https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch
https://docs.github.com/en/actions/using-workflows/reusing-workflows
https://github.com/dhet/scan-docker-tags-action


https://www.npmjs.com/package/docker-hub-tags


repo-url: https://hub.docker.com
username: ${{ secrets.DOCKER_USERNAME }}
password: ${{ secrets.DOCKER_PASSWORD }}
image: library/php
max-age-minutes: 15
tag-regex: 8\\.3\\.8-fpm-(?:alpine|bulleye|bookworm)$
