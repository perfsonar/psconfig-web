
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
Requires: nodejs
Requires: npm

%description
This application allows perfSONAR toolkit adminitrators to define / 
edit MeshConfig and publish JSON to be consumed by various perfSONAR services.

Requires epel-release

%prep
#%setup -q -n %{name}-%{version}

%install
#in case previous build fails
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d
mkdir -p $RPM_BUILD_ROOT/opt/mca
mkdir -p $RPM_BUILD_ROOT/var/lib/mca #where the sqlite3 db goes
mkdir -p $RPM_BUILD_ROOT/var/log/mca 

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

npm install node-gyp -g #need by auth/bcrypt (and others?)
npm install pm2 -g

cd /opt/mca/mca && npm --production install
cd /opt/mca/auth && npm --production install
cd /opt/mca/shared && npm --production install
cd /opt/mca/profile && npm --production install

cd /opt/mca/auth/api/config && ./genkey.sh
cd /opt/mca/auth/bin && ./auth.js issue --scopes '{ "common": ["user"] }' --sub 'mca_service' --out /opt/mca/mca/api/config/profile.jwt

pm2 startup redhat 
pm2 start /opt/mca/mca/deploy/mca.json
#pm2 start --name sca-shared /opt/mca/shared/api/shared.js 
#pm2 start --name sca-auth /opt/mca/auth/api/auth.js 
#pm2 start --name sca-profile /opt/mca/profile/api/profile.js
#pm2 start --name mccache /opt/mca/mca/api/mccache.js
#pm2 start --name mcadmin /opt/mca/mca/api/mcadmin.js
#pm2 start --name mcpub /opt/mca/mca/api/mcpub.js -i 4
pm2 save

%preun
#pm2 delete sca-shared
#pm2 delete sca-auth
#pm2 delete sca-profile
#pm2 delete mccache
#pm2 delete mcadmin
#pm2 delete mcpub
pm2 delete /opt/mca/mca/deploy/mca.json
pm2 save

%clean
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
#%doc README TODO COPYING ChangeLog
%config(noreplace) /opt/mca/*/api/config
%config(noreplace) /opt/mca/*/ui/config.js
/opt/mca
/var/lib/mca
/var/log/mca
/etc/httpd/conf.d/apache-mca.conf

%changelog
* Thu Dec 10 2015 Soichi Hayashi <hayashis@iu.edu> 0.8.18.1-0.1
- Initial RPM spec file

