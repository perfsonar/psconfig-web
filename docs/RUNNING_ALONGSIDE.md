# Running PWA alongside other web applications

## Running alongside a Toolkit or Maddash instance:

Because of port conflicts, you will have to run PWA on a different port from the perfSONAR Toolkit or Maddash or any other web application.

For instance, you might run it on port 8000 rather than port 80 for http, and port 8443 rather than 443. In this case, you need to update the ports configured in `/etc/pwa/nginx/conf.d/pwa.conf`


```javascript
    listen       80;
```

becomes


```javascript
    listen       8000;
```

AND


```javascript
listen       443 ssl;
```

becomes

```javascript
listen        8443;
```

You also need to run the nginx container differently:

```bash
docker run \
    --restart=always \
    --net pwa \
    --name nginx \
    -v /etc/pwa/shared:/shared:ro \
    -v /etc/pwa/nginx:/etc/nginx:ro \
    -v /etc/grid-security/host:/certs:ro \
    -p 8000:8000 \
    -p 8443:8443 \
    -p 9443:9443 \
    -d nginx
```
