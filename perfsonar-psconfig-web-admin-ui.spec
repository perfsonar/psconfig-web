%define install_base /usr/lib/perfsonar/psconfig-web-admin/ui
%define config_base /etc/perfsonar/psconfig-web
%define systemd_base /usr/lib/systemd/system

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d
%define apacheconf pwa-admin.conf

%define perfsonar_auto_version 4.1.6
%define perfsonar_auto_relnum 1

Name:			perfsonar-psconfig-web-admin-ui
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: UI and API
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-ui-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
#BuildArch:		noarch
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
# TODO: Make mongodb optional?
Requires:       mongodb-server 

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

# mkdirs
#ui/dist
#ui/images
#ui/js
#ui/scss
#ui/t
#ui/apidoc/css
#ui/apidoc/img
#ui/apidoc/locales
##ui/apidoc/vendor/prettify
#ui/apidoc/vendor

# do we need this one?
#deploy/docker/pwa-sample-config/scripts


make UI_ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install_ui

#rm -rf %{buildroot}/etc/perfsonar/psconfig-web/apache/%{apacheconf}
rm -rf %{buildroot}/etc/perfsonar/psconfig-web

rm -rf %{buildroot}/%{install_base}/api/pub

mkdir -p %{buildroot}/etc/httpd/conf.d
#mkdir -p %{buildroot}/etc/apache
#mkdir -p %{buildroot}/etc/shared
#mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/apache
#mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/shared
mkdir -p %{buildroot}/%{install_base}/ui/shared
mkdir -p %{buildroot}/%{install_base}/ui/js
mkdir -p %{buildroot}/%{install_base}/ui/css
mkdir -p %{buildroot}/%{install_base}/ui/dist
mkdir -p %{buildroot}/%{install_base}/ui/node_modules

#install -D -m 0644 etc/shared/*.js %{buildroot}/%{install_base}/shared

#install -D -m 0644 etc/index.js %{buildroot}/etc/perfsonar/psconfig-web/index.js

install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/%{apache_base}/pwa-admin.conf

install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-auth.service %{buildroot}/%{systemd_base}

install -D -m 0644  ui/index.html %{buildroot}/%{install_base}/ui/index.html
install -D -m 0644  ui/dist/pwa-admin-ui-bundle.js %{buildroot}/%{install_base}/ui/dist/pwa-admin-ui-bundle.js

install -D -m 0644 ui/css/*.css %{buildroot}/%{install_base}/ui/css/
install -D -m 0644 ui/css/*.css.map %{buildroot}/%{install_base}/ui/css/

install -D -m 0644 ui/js/*.js %{buildroot}/%{install_base}/ui/js/

#install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/etc/perfsonar/psconfig-web/apache

#install -D -m 0644 etc/apache/%{apacheconf} %{buildroot}/etc/apache/%{apacheconf}
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}

#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/* %{buildroot}/etc
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/auth/* %{buildroot}/etc
#install -D -m 0644 etc/shared/* %{buildroot}/etc/perfsonar/psconfig-web/shared
#install -D -m 0644 etc/shared/* %{buildroot}/etc

cp -R ui/node_modules/*  %{buildroot}/%{install_base}/ui/node_modules

rm -f %{buildroot}/%{apache_base}/%{apacheconf}
#rm -f %{buildroot}/%{install_base}/etc/perfsonar/psconfig-web/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
#chown -R apache:apache %{install_base}/etc/apache
chown -R apache:apache %{apache_base}
ln -s /etc/perfsonar/psconfig-web/shared/pwa.ui.js /usr/lib/perfsonar/psconfig-web/ui/ui/config.js

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
#%config /etc/perfsonar/psconfig-web/index.js
#%config /etc/perfsonar/psconfig-web/shared/*
%config %{apache_base}/pwa-admin.conf
%config %{systemd_base}/perfsonar-psconfig-web-admin-auth.service
#%config %{install_base}/deploy/*
#%{install_base}/cgi-bin/*
#%{install_base}/node_modules/*
%{install_base}/*
#%{install_base}/dist/pwa-admin-ui-bundle.js
#%{install_base}/shared/*
#%{install_base}/api/*.js
#%{install_base}/api/admin/server.js
#%{install_base}/api/admin/controllers/*.js
#%{install_base}/api/models/*.js
#%{install_base}/api/pub/*.js


# TODO: temporarily moved from MANIFEST
#api/pub/server.js
#api/pub/controllers.js
#api/pub/meshconfig.js

#%{install_base}/lib/perfSONAR_PS/*
#/etc/httpd/conf.d/*
#%config /etc/perfsonar/psconfig-web/index.js
#%config /etc/perfsonar/psconfig-web/shared/*
#%config /etc/perfsonar/psconfig-web/apache/pwa-admin.conf

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

