# perfSONAR Meshconfig Administartor

MeshConfig Administrator GUI and tools to publish generated meshconfig

## Installation

### VM Host

To install MCA, you will need an empty VM with any OS that supports later version of Docker, such as Centos7

Creation of VM is out of scope of this document, but we recommend following specification.

* 4-8 CPUs
* 4G memory
* 8G disk

>! Note for GOC Staff `devm06 $ mkvm -c 4 -m 4G -p -r c7 meshconfig-itb.3`

Make sure you have the latest RPMs

`yum update`

### Docker Engine

Follow the official [docker installation doc](https://docs.docker.com/engine/installation/) (not from the RHEL repo) to install docker engine.

For CentOS7..

```
$ sudo yum-config-manager \
    --add-repo https://docs.docker.com/engine/installation/linux/repo_files/centos/docker.repo
$ sudo yum check-update
$ sudo yum install docker-engine
```

Enable & start docker engine

```
$ systemctl enable docker
$ systemctl start docker
```

<!-- docker should use its own chain for I don't need iptables
### Firewall Configuration

MCA needs to expose following ports to the world

* 443 (For MCA administrative GUI)
* 80 (For MCA configuration publisher)
* 9443 (For x509 authentication to MCA administrative GUI)

For GOC /etc/iptables.d/60-local-service-rules
```
$ITFAI -j web_ok
$ITFAI4 -j web_ok
$ITFAI -p tcp --dport 9443 -j ACCEPT
$ITFAI4 -p tcp --dport 9443 -j ACCEPT
```
-->

### Container Preparation

First, let's create a docker network to group all MCA containers (so that you don't have --link them)

```
$ sudo docker network create mca
```

Next, download and deploy MCA's default configuration files

```bash
wget https://somewhere.com/mca_config.tar.gz
tar -xzf mca_config.tar.gz -C /etc
```

You should see...

```
TODO
TODO
TODO
TODO
TODO
TODO
TODO
TODO
TODO
TODO
TODO
TODO
```

### Container Installation

First, create mongo DB container and persist data on host directory (/usr/local/data/mongo)

```bash
mkdir -p /usr/local/data
docker run \
        --restart=always \
        --net mca \
        --name mongo \
        -v /usr/local/data/mongo:/data/db \
        -d mongo
```

Create SCA authentication service container. This service handles user authentication / account/user group management.

```bash
docker run \
    --restart=always \
    --net mca \
    --name sca-auth \
    -v /etc/mca/auth:/app/api/config \
    -v /usr/local/data/auth:/db \
    -d soichih/sca-auth
```

> Note: sca-auth container will generate a few files under /config directory (don't mount it with :ro)

Create MCA's main UI/API container.

```bash
docker run \
    --restart=always \
    --net mca \
    --name mca-admin1 \
    -v /etc/mca:/app/api/config:ro \
    -d soichih/mca-admin
```

And meshconfig publisher. 

```bash
docker run \
    --restart=always \
    --net mca \
    --name mca-pub1 \
    -v /etc/mca:/app/api/config:ro \
    -d soichih/mca-pub
```

Finally, we install nginx to expose these container via 80/443/9443

```bash
docker run \
    --restart=always \
    --net mca \
    --name nginx \
    -v /etc/mca/nginx:/etc/nginx:ro \
    -v /etc/grid-security/host:/certs:ro \
    -d nginx
```

Inside /etc/grid-security/host, you should see your host certificate

```
$ ls /etc/grid-security/host
cert.pem 
key.pem
ca.pem
```

Now you should see all 5 containers running.

```bash
$ docker container list
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
420b93ee7a3d        soichih/mca-pub     "node /app/api/mcp..."   3 seconds ago       Up 2 seconds        8080/tcp            mca-pub1
f30613ba389e        soichih/mca-admin   "/start.sh"              3 minutes ago       Up 3 minutes        80/tcp, 8080/tcp    mca-admin1
98527bf31365        soichih/sca-auth    "/app/docker/start.sh"   13 minutes ago      Up 13 minutes       80/tcp, 8080/tcp    sca-auth
10fdf3b63e4f        mongo               "/entrypoint.sh mo..."   16 minutes ago      Up 16 minutes       27017/tcp           mongo
```


# Reference

Meshconfig parameters
http://docs.perfsonar.net/config_mesh.html

# TODO

Remove service records that are really old (1 week?)

when a user login for the first time, I should forward user to install ui that does following
1) make the first user login as super admin
2) create sample testspec / hostgroups / config to show user how to get started

Disallow user from used testspecs / hostgroups (and show which config/test uses them)

when config is removed, test records will be orphaned - should be cascaded?

* Prevent user from removing hostgroups / testspecs currently used by a config
* Prevent user from orphaning config / testspecs / hostsgroups by removing all admins

* profile service needs to announce any updates made by user to all other services caching profile info
* Display which config/test users each hostgroup / testspecs
