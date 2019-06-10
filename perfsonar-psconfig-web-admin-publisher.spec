%define install_base /usr/lib/perfsonar/psconfig-web-admin/pub
%define config_base /etc/perfsonar/psconfig-web

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d
%define apacheconf pwa-pub.conf

%define perfsonar_auto_version 4.1.6
%define perfsonar_auto_relnum 1

Name:			perfsonar-psconfig-web-admin-publisher
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: Publisher
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:	    perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}.tar.gz
#Source0:		perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
#BuildArch:		noarch
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
# TODO: Make mongodb optional?
Requires:       mongodb-server

%description
The perfSONAR pSConfig Web Administrator Publisher package provides a webservice for
publishing Configs and host autoconfigs in pSConfig or MeshConfig formats

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}
#%setup -q -n perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}

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


mkdir -p %{buildroot}/%{install_base}/api/pub

make PUB_ROOTPATH=%{buildroot}/%{install_base} PUB_CONFIGPATH=%{buildroot}/%{config_base} install_pub

mkdir -p %{buildroot}/etc/httpd/conf.d
#mkdir -p %{buildroot}/etc/apache
#mkdir -p %{buildroot}/etc/shared
#mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/apache
#mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/shared
#mkdir -p %{buildroot}/%{install_base}/shared
#mkdir -p %{buildroot}/%{install_base}/dist
#mkdir -p %{buildroot}/%{install_base}/node_modules

#install -D -m 0644 etc/shared/*.js %{buildroot}/%{install_base}/shared

#install -D -m 0644 etc/index.js %{buildroot}/etc/perfsonar/psconfig-web/index.js

install -D -m 0644 api/pub/*.js %{buildroot}/%{install_base}/api/pub

install -D -m 0644  etc/apache/pwa-pub.conf %{buildroot}/%{apache_base}/pwa-pub.conf
#install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/etc/perfsonar/psconfig-web/apache

#install -D -m 0644 etc/apache/%{apacheconf} %{buildroot}/etc/apache/%{apacheconf}
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}

#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/* %{buildroot}/etc
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/auth/* %{buildroot}/etc
#install -D -m 0644 etc/shared/* %{buildroot}/etc/perfsonar/psconfig-web/shared
#install -D -m 0644 etc/shared/* %{buildroot}/etc

rm -f %{buildroot}/etc/perfsonar/psconfig-web/apache/%{apacheconf}
#rm -f %{buildroot}/%{install_base}/etc/perfsonar/psconfig-web/%{apacheconf}

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
#%config /etc/perfsonar/psconfig-web/index.js
#%config /etc/perfsonar/psconfig-web/shared/*
%config %{apache_base}/pwa-pub.conf
#%config %{install_base}/deploy/*
#%{install_base}/cgi-bin/*
#%{install_base}/node_modules/*
%{install_base}/api/*.js
%{install_base}/api/models/index.js
%{install_base}/api/pub/*.js


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

