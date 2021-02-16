# Building PWA
## pSConfig Web Administrator


## Tech stack
 * MEAN (MongoDB, Express, Angular, NodeJS)
 * Uses Mongoose, a sort of ORM for Mongo, for modeling object schemas and connecting/querying the Mongo database.

## Building

There are two stages of building PWA. Building the NPM dependencies, and packaging for RPM/Docker. Both are needed to do a release. Building the dependencies is also needed for creating a development environment.

### Basic build steps

There is a `Makefile` with several different build sections. The most important one, and the one that is needed prior to being able to anything else, is installing the NPM dependencies.

This can be done for production with:

```make npm```

or for development with:

```make npm_dev```

It's usually a good idea to clean up old build first:

```make clean_all```

See separate documentation in [BUILDING.md](BUILDING.md)

## Docker build

1. Checkout the branch or tag you want to build
1. Change to the docker deploy dir:

    ```cd deploy/docker ```

1. Edit `version` or `bleeding-version`, depending on what you want to build.

1. run the appropriate script

  ```./build-all.sh```

  or

  ```./bleeding-build-all.sh```



These scripts build and tag the version you specify in the version file, and push them to Dockerhub.

## RPM build

* See pS Jenkins for exact details

The build process is like this:

```make clean_all```

```make npm```

```make manifest```

```make dist```

```make rpm```
