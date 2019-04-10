%define install_base /usr/lib/perfsonar/psconfig-web-admin/shared
%define config_base %{install_base}/etc/pwa
#%define config_base /etc/pwa

# cron/apache entries are located in the 'etc' directory
#%define apache_base /etc/httpd/conf.d
#%define apacheconf pwa-admin.conf

%define perfsonar_auto_version 4.1.6
%define perfsonar_auto_relnum 1

Name:			perfsonar-psconfig-web-admin-shared
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: Shared components
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-shared-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
#BuildArch:		noarch
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
# TODO: Make mongodb optional?
Requires:       mongodb-server 

%description
Shared libraries and configs for pSConfig Web Administrator (PWA).


%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-shared-%{version}.%{perfsonar_auto_relnum}

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


make ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install

rm -rf %{buildroot}/etc/pwa/apache/%{apacheconf}

rm -rf %{buildroot}/%{install_base}/api/pub

#mkdir -p %{buildroot}/etc/httpd/conf.d
#mkdir -p %{buildroot}/etc/apache
#mkdir -p %{buildroot}/etc/shared
#mkdir -p %{buildroot}/etc/pwa/apache
mkdir -p %{buildroot}/etc/pwa/shared
#mkdir -p %{buildroot}/%{install_base}/shared
mkdir -p %{buildroot}/%{install_base}/dist
mkdir -p %{buildroot}/%{install_base}/node_modules

install -D -m 0644 etc/index.js %{buildroot}/etc/pwa/index.js

#install -D -m 0644 etc/shared/auth.ui.js %{buildroot}/etc/pwa/shared/auth.ui.js
install -D -m 0644 etc/shared/pwa.ui.js %{buildroot}/etc/pwa/shared/pwa.ui.js
install -D -m 0644 etc/shared/config.js %{buildroot}/etc/pwa/shared/config.js

#install -D -m 0644 node_modules/* %{buildroot}/%{install_base}/shared/node_modules/
cp -R node_modules/* %{buildroot}/%{install_base}/node_modules/


#install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/%{apache_base}/pwa-admin.conf
#install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/etc/pwa/apache

#install -D -m 0644 etc/apache/%{apacheconf} %{buildroot}/etc/apache/%{apacheconf}
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}

#install -D -m 0644 etc/shared/* %{buildroot}/etc/pwa/shared

#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/* %{buildroot}/etc
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/auth/* %{buildroot}/etc
#install -D -m 0644 etc/shared/* %{buildroot}/etc

rm -f %{buildroot}/etc/pwa/apache/%{apacheconf}
#rm -f %{buildroot}/%{install_base}/etc/pwa/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
#chown -R apache:apache %{install_base}/etc/apache
chown -R apache:apache %{apache_base}

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config /etc/pwa/index.js
%config /etc/pwa/shared/pwa.ui.js
%config /etc/pwa/shared/config.js
#%config %{apache_base}/pwa-admin.conf
#%config %{install_base}/deploy/*
#%{install_base}/cgi-bin/*
%{install_base}/node_modules/*
#%{install_base}/shared/*
#%{install_base}/ui/*
#%{install_base}/ui/dist/*
%{install_base}/api/*.js
#%{install_base}/api/admin/server.js
#%{install_base}/api/admin/controllers/*.js
%{install_base}/api/models/*.js
#%{install_base}/api/pub/*.js


# TODO: temporarily moved from MANIFEST
#api/pub/server.js
#api/pub/controllers.js
#api/pub/meshconfig.js

#%{install_base}/lib/perfSONAR_PS/*
#/etc/httpd/conf.d/*
#%config /etc/pwa/index.js
#%config /etc/pwa/shared/*
#%config /etc/pwa/apache/pwa-admin.conf

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

