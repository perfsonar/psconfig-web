# perfSONAR psConfig Web Admin (PWA)

psConfig Web-based administration GUI and tools to publish generated meshconfig/psconfig output

![Alt text](/readme/pwa.png?raw=true "pwa screenshot")

## Installation

### VM Host

To install PWA, you will need a VM with any OS that supports Docker; such as CentOS7

Minimum resource requirements are..

* 4-6 CPUs
* 4G memory
* 16G disk

### Docker Engine

Read the official [docker installation doc](https://docs.docker.com/engine/installation/) for more information. For CentOS 7, the Docker version from the CentOS Extras repo will work. For CentOS 6, the CentOS version might work, or you might need to try the version from the Docker repo.

For CentOS7 as root:

```bash
yum install -y docker
```

Before you start the docker engine, you might want to add any VM specific configuration. For example, your VM might be using /usr/local as a primary partition for your VM. If so, you should have something like following..

```bash
mkdir /etc/docker
```

`/etc/docker/daemon.json`

```json
{
        "graph": "/usr/local/docker"
}

```

Enable & start the docker engine.

```
$ systemctl enable docker
$ systemctl start docker
```

You should install logrotate for docker container log

/etc/logrotate.d/docker-container
```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  size=1M
  missingok
  delaycompress
  copytruncate
}
```

### Configuration

Before we start installing PWA, you should prepare your configuration files first. You can bootstrap it by
downloading and deploying PWA's default configuration files from git repo.

```bash
wget https://github.com/perfsonar/meshconfig-admin/raw/master/deploy/docker/pwa.sample.tar.gz
tar -xzf pwa.sample.tar.gz -C /etc
```
1. For PWA

    `/etc/pwa/index.js` 

    * Edit defaults `testspecs` if necessary (`meshconfig.defaults.testspecs`)
    * Edit datasource section which determines which host you'd like to load from sLS to construct your host config.
    * Update pub.url with the hostname that your PWA instance will be exposed as.

2. For Authentication Service

    `/etc/pwa/auth/index.js`

    Update `from` address to administrator's email address used to send email to confirmation new user accounts. If you'd like to skip email confirmation when user signup, simply comment out the whole email_confirmation section. 

    ```javascript
    exports.email_confirmation = {
        subject: 'psConfig Web Admin Account Confirmation',
        from: 'user@domain.tld',  //most mail server will reject if this is not replyable address
    };

    ```

3. For Nginx

    Nginx will expose various functionalities provides by various containers to the actual users. The default configuration should work, but if you need to modify the configuration, edit..

    `/etc/pwa/nginx`

#### Host Certificates

You will need SSL certificates for https access. On /etc/pwa/auth, you should see your host certificate with following file names, or place them there if not.

```bash
$ ls /etc/pwa/auth
cert.pem 
key.pem
```

If you are enabling x509 authentication, then you will also need `trusted.pem`. This file contains list of all CAs that you trust and grant access to PWA. 

> Unlike Apache, Nginx uses a single CA file for better performance.. so you have to join all .pem into a single .pem file.

### Container Installation

Now we have all configuration files necessary to start installing PWA servicves.

1. First, create a docker network to group all PWA containers (so that you don't have --link them)

    ```bash
    docker network create pwa
    ```

2. Create mongoDB container. Use -v to persist data on host directory (/usr/local/data/mongo)

    ```bash
    mkdir -p /usr/local/data
    docker run \
            --restart=always \
            --net pwa \
            --name mongo \
            -v /usr/local/data/mongo:/data/db \
            -d mongo
    ```

3. Create SCA authentication service container. This service handles user authentication / account/user group management.

    ```bash
    docker run \
        --restart=always \
        --net pwa \
        --name sca-auth \
        -v /etc/pwa/auth:/app/api/config \
        -v /usr/local/data/auth:/db \
        -d perfsonar/sca-auth
    ```

    > sca-auth container will generate a few files under /config directory when it's first started, so don't mount it with `ro`.
    > I am persisting the user account DB on /usr/local/data/auth.

4. Create PWA's main UI/API container.

    ```bash
    docker run \
        --restart=always \
        --net pwa \
        --name pwa-admin1 \
        -v /etc/pwa:/app/api/config:ro \
        -d perfsonar/pwa-admin
    ```

5. Create meshconfig publishers.

    ```bash
    docker run \
        --restart=always \
        --net pwa \
        --name pwa-pub1 \
        -v /etc/pwa:/app/api/config:ro \
        -d perfsonar/pwa-pub
    ```

You can create as many pwa-pub containers as desired (make sure to use unique names `pwa-pub1`, `pwa-pub2`, etc..) based on available resource (mainly CPU) . 1 or 2 should be fine for most cases.

If you use more than 1 instance, please edit `/etc/pwa/nginx/conf.d/pwa.conf` to include all instances, like..

```
upstream pwapub {
    server pwa-pub1:8080;
    server pwa-pub2:8080;
    server pwa-pub3:8080;
}
```


6. Finally, we install nginx to expose these container via 80/443/9443

    ```bash
    docker run \
        --restart=always \
        --net pwa \
        --name nginx \
        -v /etc/pwa/shared:/shared:ro \
        -v /etc/pwa/nginx:/etc/nginx:ro \
        -v /etc/grid-security/host:/certs:ro \
        -p 80:80 \
        -p 443:443 \
        -p 9443:9443 \
        -d nginx
    ```

Now you should see all 5 containers running.

```bash
docker container list
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                                                              NAMES
42efd21ff7f1        perfsonar/pwa-pub     "node /app/api/mcp..."   18 seconds ago      Up 17 seconds       8080/tcp                                                           pwa-pub1
ab3936c7ab8c        perfsonar/pwa-admin   "/start.sh"              19 seconds ago      Up 18 seconds       80/tcp, 8080/tcp                                                   pwa-admin1
90cfbb8ba096        perfsonar/sca-auth    "/app/docker/start.sh"   24 seconds ago      Up 24 seconds       80/tcp, 8080/tcp                                                   sca-auth
aa6471073c01        nginx               "nginx -g 'daemon ..."   11 hours ago        Up 11 hours         0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp, 0.0.0.0:9443->9443/tcp   nginx
10fdf3b63e4f        mongo               "/entrypoint.sh mo..."   12 hours ago        Up 12 hours         27017/tcp                                                          mongo
```

### Testing / Monitoring

Note: sometimes, docker containers will initially not have connectivity to the outside world. Usually this can be resolved by running `systemctl restart docker`

You should now be able to access PWA by accessing your host on your browser on the host. You should be prompted to the login page. You should signup / confirm your email address, then define host gruops / testspecs, and construct new meshconfig using those test entries.

PWA reports the current health status via following API endpoint (for pwa-admin and pwa-cache)

`https://<hostname>/api/pwa/health`

```javascript
{
    status: "ok",
    msg: "everything looks good",
    cache: {
        hosts: 255,
        update_time: 1486994021924
    }
}
```

You can configure your monitoring systems (Sensu, Nagious, etc..) to check for `status` and make sure it's set to 'ok'. 

For pwa-pub instances, you should run separate test at `http://<hostname>/pub/health` (not https://)

```javascript
{
    status: "ok"
}
```

> Please note.. if you are running multiple instances of pwa-pub, then /pub/health is just from one of the instances (not all)

You should also monitor the authentication service status

`https://<hostname>/api/auth/health`
```javascript
{
    status: "ok",
    headers: {...}
}

```

You can also monitor docker stdout/stderr log - similar to syslog.

### Update

To update PWA containers to the latest version, do `docker pull` the container you are trying to update and rerun the same `docker run ...` command you used to start it.

### Firewall

Docker will take care of its own firewall rules, so you don't have to worry about opening ports manually. 

However, following are the ports used by nginx container.

* 443 (For PWA administrative GUI)
* 80 (For PWA configuration publisher)
* 9443 (For x509 authentication to PWA administrative GUI)

## PWA API

PWA allows you to create / update meshconfig via REST API. You can use this to automate various configuration adminsitration.

Before you can start using the API, you need to obtain the access token. First, find your user ID you'd like to use (probably your user account). Login to PWA, and go to settings > account > Nerdy Things and look for `sub`.

Once you know your sub, login to your PWA server, and run something like following..

```
$ docker exec -it sca-auth bash
$ /app/bin/auth.js issue --scopes '{"pwa": ["user"]}' --sub '0' 
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NjYS5pdS5lZHUvYXV0aCIsImlhdCI6MTQ4NzYyNzE2OS45NjMsInNjb3BlcyI6eyJtY2EiOlsidXNlciJdfSwic3ViIjowfQ.hmKr5GAhabMwSltdyq21__-JSGFXFyhxLB7HxhucXLMOslqVo2yOx4qZoLprBDKcCFnKQ7fQNY0fI9coi9ix40clci--p5iSD-w4gzXaxRm2wvldUDQeA...
$ exit
```

> '0' is where you put your user ID

Copy the output from auth.js which is your access token. Store this on your server somewhere and make sure only you can access it (like chmod 600 `~/.pwa.token.jwt`)

You can now use most of the PWA REST APIs as documented here.
> https://<hostname>/apidoc/

For example, to query for the hostgroups, you can do something like

```bash
jwt=`cat ~/.pwa.token.jwt`
curl -k \
    -H "Authorization: Bearer $jwt" \
    -H "Content-Type: application/json" \
    -X POST https://<hostname>/api/pwa/hostgroup?limit=1
```

```json
{"hostgroups":[{"_id":"5884d2c28c5b1e0021328cfa","desc":"New Hostgroup","host_filter":"return false; //select none","name":"Test Bandwidth Group","service_type":"bwctl","update_date":"2017-01-31T01:29:02.949Z","create_date":"2017-01-22T15:41:54.031Z","admins":["1","2","4"],"hosts":["588544c662b49f61a8cd84ab","5886871bd4d83100216d158a","58868aa2d4d83100216d15b3","58869eea4208e70020963856","58868945d4d83100216d159a","5886895ed4d83100216d159e","5886897cd4d83100216d15a2","58868996d4d83100216d15a5","588689afd4d83100216d15a8"],"type":"static","__v":8,"_canedit":false}],"count":11}
```

# Reference

Meshconfig parameters
http://docs.perfsonar.net/config_mesh.html

# TODO

Remove service records that are really old (1 week?)

When a user login for the first time, I should forward user to install UI that does following
1) make the first user login as super admin
2) create sample testspec / hostgroups / config to show user how to get started
* Disallow user from used testspecs / hostgroups (and show which config/test uses them)
* When config is removed, test records will be orphaned - should be cascaded?

* Prevent user from removing hostgroups / testspecs currently used by a config
* Prevent user from orphaning config / testspecs / hostsgroups by removing all admins

* Profile service needs to announce any updates made by user to all other services caching profile info
* Display which config/test users each hostgroup / testspecs
