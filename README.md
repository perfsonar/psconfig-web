# perfSONAR Meshconfig Administartor

MeshConfig Administrator GUI and tools to publish generated meshconfig

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
