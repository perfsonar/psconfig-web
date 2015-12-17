
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
cd /opt/mca/mca && tar -xzf node_modules.tgz --owner=mca
cd /opt/mca/auth && tar -xzf node_modules.tgz --owner=mca
cd /opt/mca/shared && tar -xzf node_modules.tgz --owner=mca
cd /opt/mca/profile && tar -xzf node_modules.tgz --owner=mca

#setup access control, etc
#sh /opt/mca/mca/deploy/init_postgres.sh
#service postgresql initdb

#install postgresql-db
#mca doesn't work with postgresql 8.4 that comes with RHEL6 (too old for sequelize-ORM driver)
#until I find a solution, I will need to install pg9 RPM from postgresql.org
yum localinstall http://yum.postgresql.org/9.4/redhat/rhel-6-x86_64/pgdg-centos94-9.4-1.noarch.rpm
yum install postgresql94-server

#service postgresql-9.4 initdb
su - postgres -c "/usr/pgsql-9.4/bin/initdb --auth-host=md5"

#start postgresql
chkconfig postgresql-9.4 on
service postgresql-9.4 start #will fail if v8 is already running on port 5432

#create mca user/db
echo $RANDOM.$RANDOM.$RANDOM > /root/mca.pgpasswd
#su - postgres -c "initdb --auth-host=md5 --pwfile /root/pgsql.passwd -D /var/lib/pgsql/data"
su - postgres -c "psql -c \"CREATE ROLE mca PASSWORD '$(cat /root/mca.pgpasswd)' CREATEDB INHERIT LOGIN;\""
su - postgres -c "psql -c \"CREATE DATABASE mcadmin OWNER mca\""
echo "//autogeneated by mca rpm" > /opt/mca/mca/api/config/db.js
echo "module.exports = 'postgres://mca:$(cat /root/mca.pgpasswd)@localhost/mcadmin'" >> /opt/mca/mca/api/config/db.js
rm /root/mca.pgpasswd

#service postgresql start
#su - postgres -c "createuser -S -D -R -e mca"
#su - postgres -c "createdb mcadmin"

#TODO - limit access for generated keys to mca user
cd /opt/mca/auth/api/config && ./genkey.sh
cd /opt/mca/auth/bin && ./auth.js issue --scopes '{ "common": ["user"] }' --sub 'mca_service' --out /opt/mca/mca/api/config/profile.jwt

pm2 startup redhat -u mca# --hp /home/mca
su - mca -c "pm2 start /opt/mca/mca/deploy/mca.json"
su - mca -c "pm2 save"

%preun
su - mca -c "pm2 delete /opt/mca/mca/deploy/mca.json"
su - mca -c "pm2 save"

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

