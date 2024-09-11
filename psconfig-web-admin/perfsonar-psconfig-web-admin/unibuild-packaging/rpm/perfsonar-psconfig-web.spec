%define config_base /etc/perfsonar/psconfig-web
%define systemd_base /usr/lib/systemd/system
%define install_base /usr/lib/perfsonar/psconfig-web-admin

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d

%define perfsonar_auto_version 5.1.4
%define perfsonar_auto_relnum 0.a1.0
%define debug_package %{nil}

Name:			perfsonar-psconfig-web-admin
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-%{version}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-root-%(%{__id_u} -n)
BuildArch:		x86_64

%description
pSConfig Web Administrator (PWA)

%package shared
Summary:		perfSONAR pSConfig Web Administrator: Shared components
BuildRequires:  nodejs
BuildRequires:  npm
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl

%description shared
Shared libraries and configs for pSConfig Web Administrator (PWA).

%package publisher
Summary:		perfSONAR pSConfig Web Administrator: Publisher
BuildRequires:  nodejs
BuildRequires:  npm
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
Requires:       perfsonar-psconfig-web-admin-shared
Requires:       mongodb-org-server < 4.1

%description publisher
The perfSONAR pSConfig Web Administrator Publisher package provides a webservice for
publishing Configs and host autoconfigs in pSConfig or MeshConfig formats

%package ui
Summary:		perfSONAR pSConfig Web Administrator: UI and API
BuildRequires:  nodejs
BuildRequires:  npm
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
Requires:       mongodb-org < 4.1
Requires:       mongodb-org-server < 4.1
Requires:		perfsonar-psconfig-web-admin-shared
Requires:		perfsonar-psconfig-web-admin-auth
Requires:		perfsonar-psconfig-web-admin-publisher

%description ui
The perfSONAR pSConfig Web Administrator package provides an authenticated, multi-user,
web-based interface for managing perfSONAR meshes, using pSConfig or MeshConfig format.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-%{version}

%build

%install
rm -rf %{buildroot}
mkdir -p %{buildroot}/%{apache_base}
mkdir -p %{buildroot}/%{systemd_base}
mkdir -p %{buildroot}/%{install_base}/pub/api/pub

make ROOTPATH=%{buildroot}/%{install_base}/shared CONFIGPATH=%{buildroot}/%{config_base} UI_ROOTPATH=%{buildroot}/%{install_base}/ui PUB_ROOTPATH=%{buildroot}/%{install_base}/pub PUB_CONFIGPATH=%{buildroot}/%{config_base} npm manifest_files install install_pub install_ui

mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/shared
mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/pub
mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/ui
mkdir -p %{buildroot}/%{install_base}/shared/dist
mkdir -p %{buildroot}/%{install_base}/shared/node_modules
mkdir -p %{buildroot}/%{install_base}/ui/ui/shared
mkdir -p %{buildroot}/%{install_base}/ui/ui/js
mkdir -p %{buildroot}/%{install_base}/ui/ui/css
mkdir -p %{buildroot}/%{install_base}/ui/ui/node_modules

install -D -m 0644 etc/index.js %{buildroot}/etc/perfsonar/psconfig-web/index.js
install -D -m 0644 etc/shared/pwa.ui.js %{buildroot}/etc/perfsonar/psconfig-web/shared/pwa.ui.js
install -D -m 0644 etc/shared/config.js %{buildroot}/etc/perfsonar/psconfig-web/shared/config.js

#publisher
install -D -m 0644 api/pub/*.js %{buildroot}/%{install_base}/pub/api/pub
install -D -m 0644  etc/apache/pwa-pub.conf %{buildroot}/%{apache_base}/pwa-pub.conf
install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-publisher.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-publisher.service
rm -f  %{buildroot}%{install_base}/pub/deploy/systemd/perfsonar-psconfig-web-admin-publisher.service
ln -sf /etc/perfsonar/psconfig-web/index.js  %{buildroot}/%{install_base}/pub/api/config.js
rm -f %{buildroot}/etc/perfsonar/psconfig-web/apache/pwa-pub.conf
cp -R node_modules/* %{buildroot}/%{install_base}/shared/node_modules/

#ui
install -D -m 0644 etc/apache/pwa-admin.conf %{buildroot}/%{apache_base}/pwa-admin.conf
rm -f %{buildroot}/etc/perfsonar/psconfig-web/apache/pwa-admin.conf
install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-api.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-api.service
install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-cache.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-cache.service
install -D -m 0644  ui/index.html %{buildroot}/%{install_base}/ui/ui/index.html
install -D -m 0644 ui/css/*.css %{buildroot}/%{install_base}/ui/ui/css/
install -D -m 0644 ui/css/*.css.map %{buildroot}/%{install_base}/ui/ui/css/
install -D -m 0644 ui/js/*.js %{buildroot}/%{install_base}/ui/ui/js/

cp -R ui/node_modules/*  %{buildroot}/%{install_base}/ui/ui/node_modules

#Fix all python shebangs from external stuff
grep -rl 'env python' %{buildroot}/%{install_base} | xargs sed -i -E -e 's@^#!/usr/bin/env python$@#!/usr/bin/env python3@'
grep -rl '/usr/bin/python' %{buildroot}/%{install_base} | xargs sed -i -E -e 's@^#!/usr/bin/python$@#!/usr/bin/env python3@'

%clean
rm -rf %{buildroot}

%post shared
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}/shared
chown -R apache:apache %{apache_base}

service httpd restart &> /dev/null || :

%post publisher
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}/pub
chown -R apache:apache %{apache_base}

systemctl restart httpd &> /dev/null || :

systemctl enable perfsonar-psconfig-web-admin-publisher.service

systemctl restart perfsonar-psconfig-web-admin-publisher.service

%post ui
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}/ui
chown -R apache:apache %{apache_base}
# create UI config symlink
ln -sf /etc/perfsonar/psconfig-web/shared/pwa.ui.js /usr/lib/perfsonar/psconfig-web-admin/ui/ui/config.js
# create API service config symlink
ln -sf /etc/perfsonar/psconfig-web/index.js /usr/lib/perfsonar/psconfig-web-admin/ui/api/config.js

systemctl restart httpd  &> /dev/null || :

systemctl enable perfsonar-psconfig-web-admin-api.service perfsonar-psconfig-web-admin-cache.service

systemctl restart perfsonar-psconfig-web-admin-api.service perfsonar-psconfig-web-admin-cache.service

%files
%defattr(-,perfsonar,perfsonar,-)

%files shared
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config(noreplace) /etc/perfsonar/psconfig-web/index.js
%config(noreplace) /etc/perfsonar/psconfig-web/shared/pwa.ui.js
%config(noreplace) /etc/perfsonar/psconfig-web/shared/config.js
%{install_base}/shared/node_modules/*
%{install_base}/shared/api/*.js
%{install_base}/shared/api/pub/*.js
%{install_base}/shared/api/models/*.js

%files publisher
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config(noreplace) %{apache_base}/pwa-pub.conf
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-publisher.service
%{install_base}/pub/api/*.js
%{install_base}/pub/api/models/index.js
%{install_base}/pub/api/pub/*.js

%files ui
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config(noreplace) %{apache_base}/pwa-admin.conf
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-api.service
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-cache.service
%{install_base}/ui/*

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

