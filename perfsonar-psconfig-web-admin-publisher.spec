%define install_base /usr/lib/perfsonar/psconfig-web-admin/pub
%define config_base /etc/perfsonar/psconfig-web
%define systemd_base /usr/lib/systemd/system

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d
%define apacheconf pwa-pub.conf

%define perfsonar_auto_version 4.3.4
%define perfsonar_auto_relnum 0.a1.0
%define debug_package %{nil}

Name:			perfsonar-psconfig-web-admin-publisher
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: Publisher
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:	    perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl
Requires:       perfsonar-psconfig-web-admin-shared
Requires:       mongodb-server 
#Requires:       mongodb-org-server #TODO we may have to change to this

%description
The perfSONAR pSConfig Web Administrator Publisher package provides a webservice for
publishing Configs and host autoconfigs in pSConfig or MeshConfig formats

%pre
/usr/sbin/groupadd perfsonar 2> /dev/null || :
/usr/sbin/useradd -g perfsonar -r -s /sbin/nologin -c "perfSONAR User" -d /tmp perfsonar 2> /dev/null || :

%prep
%setup -q -n perfsonar-psconfig-web-admin-publisher-%{version}.%{perfsonar_auto_relnum}

%build

%install
rm -rf %{buildroot}

mkdir -p %{buildroot}/%{install_base}/api/pub
mkdir -p %{buildroot}/%{systemd_base}

make PUB_ROOTPATH=%{buildroot}/%{install_base} PUB_CONFIGPATH=%{buildroot}/%{config_base} install_pub

mkdir -p %{buildroot}/etc/httpd/conf.d

install -D -m 0644 api/pub/*.js %{buildroot}/%{install_base}/api/pub

install -D -m 0644  etc/apache/pwa-pub.conf %{buildroot}/%{apache_base}/pwa-pub.conf

install -D -m 0644 deploy/systemd/perfsonar-psconfig-web-admin-publisher.service %{buildroot}/%{systemd_base}/perfsonar-psconfig-web-admin-publisher.service

rm  -f  %{buildroot}%{install_base}/deploy/systemd/perfsonar-psconfig-web-admin-publisher.service

ln -sf /etc/perfsonar/psconfig-web/index.js  %{buildroot}/%{install_base}/api/config.js

rm -f %{buildroot}/etc/perfsonar/psconfig-web/apache/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
chown -R apache:apache %{apache_base}

systemctl restart httpd &> /dev/null || :

systemctl enable perfsonar-psconfig-web-admin-publisher.service

systemctl restart perfsonar-psconfig-web-admin-publisher.service

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config(noreplace) %{apache_base}/pwa-pub.conf
%config(noreplace) %{systemd_base}/perfsonar-psconfig-web-admin-publisher.service
%{install_base}/api/*.js
%{install_base}/api/models/index.js
%{install_base}/api/pub/*.js

%changelog
* Tue Sep 22 2020 mj82@grnoc.iu.edu 4.3.0.1-1.beta.1
- Release 4.3.0-beta.1
 
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

