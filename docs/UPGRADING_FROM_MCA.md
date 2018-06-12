# Upgrading from older MeshConfig Admin (MCA) to new psConfig Web Administrator (PWA) 

## Upgrading

If you are upgrading from an older version of MCA to the new PWA, you may want to do a clean install and manually copy any configuration settings you have changed over to the new PWA config.

Files that have changed/that you need to change
 * /etc/mca moves to /etc/pwa
 * within /etc/pwa:
    * index.js
        * change the name of the mongo db. The old name was `mca`, new is `pwa` -- if you want to start completely fresh, leave this as `pwa`. if you want to retain your configs, change this back to `mca` to use your existing database.
    * shared/mca.ui.js moves to shared/pwa.ui.js
        * update the url path from `../api/mca` to `../api/pwa`
        * change the title from "MeshConfig Admin" to "pSConfig Web Admin"
    * shared/auth.ui.js
        * change title to "PWA Authentication Service"
        * change logo_400_url to `images/pscweb_logo.png`

You will also need to add the new `pwa` role to each user:
```bash
docker exec -it sca-auth /app/bin/auth.js modscope --username user --add '{"pwa": ["user"]}'
```

To make them an admin:
```bash
docker exec -it sca-auth /app/bin/auth.js modscope --username user --add '{"pwa": ["admin"]}'
```

