
#%define __arch_install_post /bin/true

Name: mca
Version: 1.0
Release: 1%{?dist}
Summary: Meshconfig administration web UI and publisher

License: MIT
URL: https://github.com/soichih/meshconfig-admin
#Source0: %{name}-%{version}.zip

BuildRequires: git
BuildRequires: which
BuildRequires: postgresql-devel
BuildRequires: tar

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

cd $RPM_BUILD_ROOT/opt/mca/mca/ui && bower install -p --allow-root
cd $RPM_BUILD_ROOT/opt/mca/auth/ui && bower install -p --allow-root
cd $RPM_BUILD_ROOT/opt/mca/shared/ui && bower install -p --allow-root 
cd $RPM_BUILD_ROOT/opt/mca/profile/ui && bower install -p --allow-root

#cp $RPM_BUILD_ROOT/opt/mca/meshconfig/rhel6/mca.init $RPM_BUILD_ROOT/etc/init.d/mca

ln -sf /opt/mca/mca/deploy/apache-mca.conf $RPM_BUILD_ROOT/etc/httpd/conf.d/apache-mca.conf
cp -r $RPM_BUILD_ROOT/opt/mca/mca/deploy/conf/*  $RPM_BUILD_ROOT/opt/mca

#install node_modules
npm install pm2 -g
npm install node-gyp -g #need by auth/bcrypt (and others?)
function npm_install {
    npm --production install 
    tar -czf node_modules.tgz node_modules 
    rm -rf node_modules
}
cd $RPM_BUILD_ROOT/opt/mca/mca && npm_install
cd $RPM_BUILD_ROOT/opt/mca/auth && npm_install
cd $RPM_BUILD_ROOT/opt/mca/shared && npm_install
cd $RPM_BUILD_ROOT/opt/mca/profile && npm_install

%post

#uncompress node_modules
cd /opt/mca/mca && tar -xzf node_modules.tgz
cd /opt/mca/auth && tar -xzf node_modules.tgz
cd /opt/mca/shared && tar -xzf node_modules.tgz
cd /opt/mca/profile && tar -xzf node_modules.tgz

sh /opt/mca/mca/deploy/init_postgres.sh

cd /opt/mca/auth/api/config && ./genkey.sh
cd /opt/mca/auth/bin && ./auth.js issue --scopes '{ "common": ["user"] }' --sub 'mca_service' --out /opt/mca/mca/api/config/profile.jwt

pm2 startup redhat 
pm2 start /opt/mca/mca/deploy/mca.json
pm2 save

%preun
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

