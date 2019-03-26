%define install_base /usr/lib/perfsonar/psconfig-web
%define config_base %{install_base}/etc

# cron/apache entries are located in the 'etc' directory
%define apacheconf apache-pwa-toolkit_web_gui.conf

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

make ROOTPATH=%{buildroot}/%{install_base} CONFIGPATH=%{buildroot}/%{config_base} install

mkdir -p %{buildroot}/etc/httpd/conf.d

install -D -m 0644 etc/%{apacheconf} %{buildroot}/etc/httpd/conf.d/%{apacheconf}
rm -f %{buildroot}/%{install_base}/etc/{apacheconf}

%clean
rm -rf %{buildroot}

%post
mkdir -p /var/log/perfsonar
chown perfsonar:perfsonar /var/log/perfsonar
chown -R perfsonar:perfsonar %{install_base}
chown -R apache:apache %{install_base}/etc

service httpd restart &> /dev/null || :

%files
%defattr(-,perfsonar,perfsonar,-)
%license LICENSE
%config %{install_base}/etc/*
#%{install_base}/cgi-bin/*
%{install_base}/ui/*
#%{install_base}/lib/perfSONAR_PS/*
/etc/httpd/conf.d/*

%changelog
* Fri Mar 1 2019 mj82@grnoc.iu.edu 4.2.0.1-1.a1
- Initial release as an RPM 

