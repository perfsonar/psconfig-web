
#%define __arch_install_post /bin/true

Name: mca
Version: 1.0
Release: 2
Summary: Meshconfig administration web UI and publisher

License: MIT
URL: https://github.com/soichih/meshconfig-admin
#Source0: %{name}-%{version}.zip

BuildRequires: git
BuildRequires: which
BuildRequires: postgresql-devel
BuildRequires: tar

Requires: httpd
Requires: mod_ssl

#Requires: postgresql
#Requires: postgresql-server

Requires: postgresql94
Requires: postgresql94-server

Requires: sqlite
Requires: sqlite-devel
Requires: nodejs
Requires: npm

%description
This application allows perfSONAR toolkit adminitrators to define / 
edit MeshConfig and publish JSON to be consumed by various perfSONAR services.

Requires epel-release

%prep
/usr/sbin/groupadd mca
#/usr/sbin/useradd -g mca -r -s /sbin/nologin -c "MeshConfig Admin User" -d /tmp mca 
/usr/sbin/useradd -g mca mca

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
function npm_install_and_tar {
    npm --production install 
    tar -czf node_modules.tgz node_modules 
    rm -rf node_modules
}
cd $RPM_BUILD_ROOT/opt/mca/mca && npm_install_and_tar
cd $RPM_BUILD_ROOT/opt/mca/auth && npm_install_and_tar
cd $RPM_BUILD_ROOT/opt/mca/shared && npm_install_and_tar
cd $RPM_BUILD_ROOT/opt/mca/profile && npm_install_and_tar

%post

#uncompress node_modules
cd /opt/mca/mca && tar -xzf node_modules.tgz && rm node_modules.tgz
cd /opt/mca/auth && tar -xzf node_modules.tgz && rm node_modules.tgz
cd /opt/mca/shared && tar -xzf node_modules.tgz && node_modules.tgz
cd /opt/mca/profile && tar -xzf node_modules.tgz && node_modules.tgz
chown -R mca:mca /opt/mca

#install postgresql-db
#mca doesn't work with postgresql 8.4 that comes with RHEL6 (too old for sequelize-ORM driver)
#until I find a solution, I will need to install pg9 RPM from postgresql.org
#yum localinstall -y http://yum.postgresql.org/9.4/redhat/rhel-6-x86_64/pgdg-centos94-9.4-1.noarch.rpm
#yum install -y postgresql94-server

#deploy to pm2 and immediately stop (let user start it)
#pm2 startup redhat -u mca
#su - mca -c "pm2 start /opt/mca/mca/deploy/mca.json"
#su - mca -c "pm2 save"
#su - mca -c "pm2 stop /opt/mca/mca/deploy/mca.json"

%preun
#su - mca -c "pm2 delete /opt/mca/mca/deploy/mca.json"
#su - mca -c "pm2 save"

%clean
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,mca,mca)
#%doc README TODO COPYING ChangeLog
%config(noreplace) /opt/mca/*/api/config
%config(noreplace) /opt/mca/*/ui/config.js
/opt/mca
/var/lib/mca
/var/log/mca
/etc/httpd/conf.d/apache-mca.conf

%attr(-,root,root) /etc/httpd/conf.d/apache-mca.conf

%changelog
* Thu Dec 10 2015 Soichi Hayashi <hayashis@iu.edu> 0.8.18.1-0.1
- Initial RPM spec file

