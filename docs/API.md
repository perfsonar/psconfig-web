## PWA API

PWA allows you to create / update meshconfig via REST API. You can use this to automate various configuration administration.

Before you can start using the API, you need to obtain the access token. 

Login to your PWA server, and run something like following..

```bash
$ docker exec -it sca-auth bash
$ /app/bin/auth.js issue --scopes '{"pwa": ["user"]}' --username 'username' 
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NjYS5pdS5lZHUvYXV0aCIsImlhdCI6MTQ4NzYyNzE2OS45NjMsInNjb3BlcyI6eyJtY2EiOlsidXNlciJdfSwic3ViIjowfQ.hmKr5GAhabMwSltdyq21__-JSGFXFyhxLB7HxhucXLMOslqVo2yOx4qZoLprBDKcCFnKQ7fQNY0fI9coi9ix40clci--p5iSD-w4gzXaxRm2wvldUDQeA...
$ exit
```

Copy the output from auth.js which is your access token. Store this on your server somewhere and make sure only you can access it (like chmod 600 `~/.pwa.token.jwt`)

You can now use most of the PWA REST APIs as documented here.
> https://hostname/apidoc/

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

