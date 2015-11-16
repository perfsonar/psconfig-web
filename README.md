# perfSONAR Meshconfig Administartor

MeshConfig Administrator GUI and tools to publish generated meshconfig

# Reference

Meshconfig parameters
http://docs.perfsonar.net/config_mesh.html

# TODO

Remove service records that are really old (1 week?) and maybe separate slscache service into a separate service.

when a user login for the first time, I should forward user to install ui that does following
1) make the first user login as super admin
2) create sample testspec / hostgroups / config to show user how to get started

Disallow user from used testspecs / hostgroups (and show which config/test uses them)

migration not receiving queryinterface

Populate some sample testspecs / hosts / config(?) as very first migration?

"sign in to see admin" doesn't make any sense.. because they are all public via json!

when config is removed, test records will be orphaned - should be cascaded?
