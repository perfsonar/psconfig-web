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

Docker exposes all ports on 0.0.0.0 by default. To make it a bit more secure, you should set default IP.

/etc/docker/daemon.json
```
{
    "ip": "127.0.0.1"
}

```

Make sure to enable / start it

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

### Install Containers

First, create a docker network to group all MCA containers (so that you don't have --link them)

```
$ sudo docker network create mca
```

Start mongo and persist data on host

```bash
docker run \
        --restart=always \
        --net mca \
        --name mongodb \
        -v /usr/local/mongodb-data:/data/db \
        -d mongo
```




### MongoDB

MCA uses MongoDB 

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
