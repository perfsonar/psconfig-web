%define install_base /usr/lib/perfsonar/psconfig-web-admin
%define config_base %{install_base}/etc/pwa
#%define config_base /etc/pwa

# cron/apache entries are located in the 'etc' directory
%define apacheconf pwa-admin.conf

%define perfsonar_auto_version 4.1.6
%define perfsonar_auto_relnum 1

Name:			perfsonar-psconfig-web-admin
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: UI and API
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		noarch
Requires:       	nodejs
Requires:		httpd
# TODO: Make mongodb optional?
Requires:       	mongodb-server 
Requires:       	sqlite

%description
The perfSONAR pSConfig Web Administrator package provides an authenticated, multi-user,
web-based interface for managing perfSONAR meshes, using pSConfig or MeshConfig format.

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-%{version}.%{perfsonar_auto_relnum}

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

#mkdir -p %{buildroot}/etc/httpd/conf.d
#mkdir -p %{buildroot}/etc/apache
#mkdir -p %{buildroot}/etc/shared
mkdir -p %{buildroot}/etc/pwa/apache
mkdir -p %{buildroot}/etc/pwa/shared


install -D -m 0644 etc/index.js %{buildroot}/etc/pwa/index.js

install -D -m 0644  etc/apache/pwa-admin.conf %{buildroot}/etc/pwa/apache
#install -D -m 0644 etc/apache/%{apacheconf} %{buildroot}/etc/apache/%{apacheconf}
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}

#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/apache/* %{buildroot}/etc
#install -D -m 0644 deploy/docker/pwa-sample-config/pwa/auth/* %{buildroot}/etc
install -D -m 0644 etc/shared/* %{buildroot}/etc/pwa/shared
#install -D -m 0644 etc/shared/* %{buildroot}/etc

rm -f %{buildroot}/%{install_base}/etc/pwa/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
chown -R apache:apache %{install_base}/etc/apache

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config /etc/pwa/index.js
%config /etc/pwa/shared/*
%config /etc/pwa/apache/pwa-admin.conf
#%config %{install_base}/deploy/*
#%{install_base}/cgi-bin/*
%{install_base}/ui/*
#%{install_base}/lib/perfSONAR_PS/*
#/etc/httpd/conf.d/*
#%config /etc/pwa/index.js
#%config /etc/pwa/shared/*
#%config /etc/pwa/apache/pwa-admin.conf

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

