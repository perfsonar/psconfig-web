
#%define __arch_install_post /bin/true

Name: mca
Version: 1.0
Release: 1%{?dist}
Summary: Meshconfig administration web UI and publisher

License: MIT
URL: https://github.com/soichih/meshconfig-admin
#Source0: %{name}-%{version}.zip

BuildRequires: git

Requires: httpd
Requires: postgresql
Requires: postgresql-server
Requires: postgresql-devel
Requires: sqlite
Requires: sqlite-devel
Requires: epel-release
Requires: nodejs
Requires: npm

%description
This application allows perfSONAR toolkit adminitrators to define / 
edit MeshConfig and publish JSON to be consumed by various perfSONAR services.

%prep
#%setup -q -n %{name}-%{version}

%install
#in case previous build fails
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d
mkdir -p $RPM_BUILD_ROOT/opt/mca

#TODO - pick specific branch / tag instead of master
git clone https://github.com/soichih/meshconfig-admin.git $RPM_BUILD_ROOT/opt/mca/mca
git clone https://github.com/soichih/sca-auth.git $RPM_BUILD_ROOT/opt/mca/auth
git clone https://github.com/soichih/sca-profile.git $RPM_BUILD_ROOT/opt/mca/profile
git clone https://github.com/soichih/sca-shared.git $RPM_BUILD_ROOT/opt/mca/shared

cd $RPM_BUILD_ROOT/opt/mca/mca/ui && bower install -p
cd $RPM_BUILD_ROOT/opt/mca/auth/ui && bower install -p
cd $RPM_BUILD_ROOT/opt/mca/shared/ui && bower install -p
cd $RPM_BUILD_ROOT/opt/mca/profile/ui && bower install -p

#cp $RPM_BUILD_ROOT/opt/mca/meshconfig/rhel6/mca.init $RPM_BUILD_ROOT/etc/init.d/mca

ln -sf /opt/mca/mca/deploy/apache-mca.conf $RPM_BUILD_ROOT/etc/httpd/conf.d/apache-mca.conf
cp -r $RPM_BUILD_ROOT/opt/mca/mca/deploy/conf/*  $RPM_BUILD_ROOT/opt/mca

%post

cd /opt/mca/mca && npm --production install
cd /opt/mca/auth && npm --production install
cd /opt/mca/shared && npm --production install
cd /opt/mca/profile && npm --production install

cd /opt/mca/auth/api/config && ./genkey.sh

npm install pm2 -g
pm2 deploy /opt/mca/mca/deploy/mca.json
#pm2 save
pm2 startup redhat 

%clean
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
#%doc README TODO COPYING ChangeLog
%config(noreplace) /opt/mca/mca/api/config
%config(noreplace) /opt/mca/mca/ui/config.js
%config(noreplace) /opt/mca/auth/api/config
%config(noreplace) /opt/mca/auth/ui/config.js
%config(noreplace) /opt/mca/profile/api/config
%config(noreplace) /opt/mca/profile/ui/config.js
#%config(noreplace) /opt/mca/shared/api/config
#%config(noreplace) /opt/mca/shared/ui/config.js
#/etc/init.d/mca
/opt/mca
/etc/httpd/conf.d/apache-mca.conf

%changelog
* Thu Dec 10 2015 Soichi Hayashi <hayashis@iu.edu> 0.8.18.1-0.1
- Initial RPM spec file

