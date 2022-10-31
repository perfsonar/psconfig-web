# PWA Development

## pSConfig Web Administrator

## Tech stack

-   MEAN (MongoDB, Express, Angular, NodeJS)
-   Uses Mongoose, a sort of ORM for Mongo, for modeling object schemas and connecting/querying the Mongo database.

## Building

See separate documentation in [BUILDING.md](BUILDING.md)

## Development environment

The current development environment includes Apache HTTP Server, MongoDB, Node.js, and PM2. In addition to psconfig-web itself, you'll also need to install [sca-auth](https://github.com/perfsonar/sca-auth) which psconfig-web uses for authentication. Visual Studio Code is the recommended editor. Recommended VS Code extensions are listed below and included in `.vscode/extensions.json` for easy installation.

-   [Apache HTTP Server](https://httpd.apache.org)
-   [MongoDB](https://www.mongodb.com)
-   [Node.js](https://nodejs.org)
-   [PM2](https://pm2.keymetrics.io)
-   [Visual Studio Code](https://code.visualstudio.com)
    -   [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
    -   [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=editorconfig.editorconfig)
    -   [Git Extension Pack](https://marketplace.visualstudio.com/items?itemName=donjayamanne.git-extension-pack)
    -   [Mocha sidebar](https://marketplace.visualstudio.com/items?itemName=maty.vscode-mocha-sidebar)
    -   [Node.js Extension Pack](https://marketplace.visualstudio.com/items?itemName=waderyan.nodejs-extension-pack)
    -   [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
    -   [Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)

**Apache**

To get everything working together, you'll need to tell Apache where all the microservices are located. To do that:

1. Edit [etc/pwa-dev.conf](https://github.com/perfsonar/psconfig-web/blob/master/etc/pwa-dev.conf) with the paths appropriate for your system.
2. Create a symbolic link in your Apache config directory to this file (or just copy it there).
3. Start (or restart) httpd.

**psconfig-web**

1. `git clone https://github.com/perfsonar/psconfig-web.git`
2. `cd psconfig-web && make npm_dev`
3. `./start.sh`

**sca-auth**

1. `git clone https://github.com/perfsonar/sca-auth.git`
2. `cd sca-auth && npm install`
3. `pushd ui && npm install && popd`
4. `cd api && ./start.sh`

PM2 should now be running all the services and will restart services when code is changed. Use `pm2 logs` to see log messages.

**Tests**

Test data is included in [test/data/pwa-test1-mongodump.tar.gz](https://github.com/perfsonar/psconfig-web/blob/master/test/data/pwa-test1-mongodump.tar.gz). This database should be restored to your local MongoDB instance so tests can run properly.

1. `tar xvzf test/data/pwa-test1-mongodump.tar.gz`
2. `sudo mongorestore --drop dump/pwa-test1`
3. `rm -r dump`

**Debugging**

To set breakpoints in the code, you can stop the PM2 instance of a particular service and start it in VS Code.

1. `pm2 stop pwapub`
2. In VS Code, add breakpoints in the breakpoint gutter or functional breakpoints in the _Run & Debug_ tab.
3. In the _Run & Debug_ tab, select the _Launch Publisher_ configuration and click the play button.

## Architecture

### Architecture Diagram

![Alt text](pwa-architecture.png "pwa architecture")

pSConfig Web-based administration GUI and tools to publish configs in pSConfig/MeshConfig formats.

Documentation for PWA can be found on the main perfSONAR documentation site:

-   [pSConfig Web Admin documentation](http://docs.perfsonar.net/pwa.html)
