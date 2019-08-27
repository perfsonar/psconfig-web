%define install_base /usr/lib/perfsonar/psconfig-web-admin/ui
%define config_base /etc/perfsonar/psconfig-web
%define systemd_base /usr/lib/systemd/system

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d
%define apacheconf pwa-admin.conf

%define perfsonar_auto_version 4.3.0
%define perfsonar_auto_relnum 0.a0.0
%define debug_package %{nil}

Name:			perfsonar-psconfig-web-admin-ui
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: UI and API
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-ui-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
Requires:       mongodb
Requires:       mongodb-server
Requires:		perfsonar-psconfig-web-admin-shared
Requires:		perfsonar-psconfig-web-admin-auth

%description
The perfSONAR pSConfig Web Administrator package provides an authenticated, multi-user,
web-based interface for managing perfSONAR meshes, using pSConfig or MeshConfig format.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-ui-%{version}.%{perfsonar_auto_relnum}

%build

%install
rm -rf %{buildroot}

make UI_ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install_ui

rm -rf %{buildroot}/etc/perfsonar/psconfig-web

rm -rf %{buildroot}/%{install_base}/api/pub

mkdir -p %{buildroot}/%{apache_base}
mkdir -p %{buildroot}/%{systemd_base}
mkdir -p %{buildroot}/%{install_base}/ui/shared
mkdir -p %{buildroot}/%{install_base}/ui/js
mkdir -p %{buildroot}/%{install_base}/ui/css
#mkdir -p %{buildroot}/%{install_base}/ui/dist
mkdir -p %{buildroot}/%{install_base}/ui/node_modules

install -D -m 0644 etc/apache/pwa-admin.conf %{buildroot}/%{apache_base}/pwa-admin.conf

install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-api.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-api.service
install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-cache.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-cache.service

install -D -m 0644  ui/index.html %{buildroot}/%{install_base}/ui/index.html
#install -D -m 0644  ui/dist/pwa-admin-ui-bundle.js %{buildroot}/%{install_base}/ui/dist/pwa-admin-ui-bundle.js

install -D -m 0644 ui/css/*.css %{buildroot}/%{install_base}/ui/css/
install -D -m 0644 ui/css/*.css.map %{buildroot}/%{install_base}/ui/css/

install -D -m 0644 ui/js/*.js %{buildroot}/%{install_base}/ui/js/

cp -R ui/node_modules/*  %{buildroot}/%{install_base}/ui/node_modules

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
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
%license LICENSE
%config(noreplace) %{apache_base}/pwa-admin.conf
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-api.service
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-cache.service
%{install_base}/*

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

