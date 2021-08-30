%define install_base /usr/lib/perfsonar/psconfig-web-admin/shared
%define config_base /etc/perfsonar/psconfig-web

# cron/apache entries are located in the 'etc' directory
%define apache_base /etc/httpd/conf.d

%define perfsonar_auto_version 4.4.1
%define perfsonar_auto_relnum 1
%define debug_package %{nil}

Name:			perfsonar-psconfig-web-admin-shared
Version:		%{perfsonar_auto_version}
Release:		%{perfsonar_auto_relnum}%{?dist}
Summary:		perfSONAR pSConfig Web Administrator: Shared components
License:		ASL 2.0
Group:			Applications/Communications
URL:			http://www.perfsonar.net
Source0:		perfsonar-psconfig-web-admin-shared-%{version}.%{perfsonar_auto_relnum}.tar.gz
BuildRoot:		%{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:		x86_64
Requires:       nodejs
Requires:		httpd
Requires:       mod_ssl

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

make ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install

rm -rf %{buildroot}/etc/perfsonar/psconfig-web

rm -rf %{buildroot}/%{apache_base}/%{apacheconf}

rm -rf %{buildroot}/%{install_base}/api/pub

mkdir -p %{buildroot}/etc/perfsonar/psconfig-web/shared
mkdir -p %{buildroot}/%{install_base}/dist
mkdir -p %{buildroot}/%{install_base}/node_modules

install -D -m 0644 etc/index.js %{buildroot}/etc/perfsonar/psconfig-web/index.js
install -D -m 0644 etc/shared/pwa.ui.js %{buildroot}/etc/perfsonar/psconfig-web/shared/pwa.ui.js
install -D -m 0644 etc/shared/config.js %{buildroot}/etc/perfsonar/psconfig-web/shared/config.js

cp -R node_modules/* %{buildroot}/%{install_base}/node_modules/


rm -f %{buildroot}/%{apache}/%{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
chown -R apache:apache %{apache_base}

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config(noreplace) /etc/perfsonar/psconfig-web/index.js
%config(noreplace) /etc/perfsonar/psconfig-web/shared/pwa.ui.js
%config(noreplace) /etc/perfsonar/psconfig-web/shared/config.js
%{install_base}/node_modules/*
%{install_base}/api/*.js
%{install_base}/api/models/*.js

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

