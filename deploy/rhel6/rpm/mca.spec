
#%define __arch_install_post /bin/true

Name: mca
Version: 2.0
Release: 29
Summary: Meshconfig administration web UI and publisher

License: MIT
URL: https://github.com/soichih/meshconfig-admin

BuildRequires: tar
BuildRequires: git
BuildRequires: which
BuildRequires: postgresql-devel

Requires: tar
Requires: wget
Requires: httpd
Requires: mod_ssl

#Requires: postgresql
#Requires: postgresql-server
Requires: postgresql92

Requires: npm
Requires: nodejs
Requires: sqlite
Requires: sqlite-devel

%description
This application allows perfSONAR toolkit adminitrators to define / 
edit MeshConfig and publish JSON to be consumed by various perfSONAR services.

Requires epel-release for nodejs

%install
#in case previous build fails
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

mkdir -p $RPM_BUILD_ROOT/opt/mca
mkdir -p $RPM_BUILD_ROOT/etc/init.d
mkdir -p $RPM_BUILD_ROOT/var/log/mca 
mkdir -p $RPM_BUILD_ROOT/var/lib/mca #sqlite3 db
mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d

git clone https://github.com/soichih/sca-auth.git $RPM_BUILD_ROOT/opt/mca/auth
git clone https://github.com/soichih/sca-shared.git $RPM_BUILD_ROOT/opt/mca/shared
git clone https://github.com/soichih/sca-profile.git $RPM_BUILD_ROOT/opt/mca/profile
git clone https://github.com/soichih/meshconfig-admin.git $RPM_BUILD_ROOT/opt/mca/mca
#ln -sf /mca $RPM_BUILD_ROOT/opt/mca/mca

cd $RPM_BUILD_ROOT/opt/mca/mca/ui && bower install -p --allow-root
cd $RPM_BUILD_ROOT/opt/mca/auth/ui && bower install -p --allow-root
cd $RPM_BUILD_ROOT/opt/mca/shared/ui && bower install -p --allow-root 
cd $RPM_BUILD_ROOT/opt/mca/profile/ui && bower install -p --allow-root

cp -r $RPM_BUILD_ROOT/opt/mca/mca/deploy/conf/*  $RPM_BUILD_ROOT/opt/mca
ln -sf /opt/mca/mca/deploy/rhel6/mca.init $RPM_BUILD_ROOT/etc/init.d/mca
ln -sf /opt/mca/mca/deploy/apache-mca.conf $RPM_BUILD_ROOT/etc/httpd/conf.d/apache-mca.conf

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

%pre
#create only if mca doesn't exist
id -g mca &>/dev/null || /usr/sbin/groupadd mca
id -u mca &>/dev/null || /usr/sbin/useradd -g mca mca

%post
cd /opt/mca/mca && tar -xzf node_modules.tgz && rm node_modules.tgz
cd /opt/mca/auth && tar -xzf node_modules.tgz && rm node_modules.tgz
cd /opt/mca/shared && tar -xzf node_modules.tgz && rm node_modules.tgz
cd /opt/mca/profile && tar -xzf node_modules.tgz && rm node_modules.tgz
chown -R mca:mca /opt/mca

npm install pm2 -g

%preun
su - mca -c "pm2 delete /opt/mca/mca/deploy/mca.json"
su - mca -c "pm2 save"

#su - mca -c "pm2 kill" #so that I can remove mca user
#/usr/sbin/userdel mca
#/usr/sbin/groupdel mca

%clean
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,mca,mca)
%config(noreplace) /opt/mca/*/api/config
%config(noreplace) /opt/mca/*/ui/config.js
/opt/mca
/var/lib/mca
/var/log/mca
/etc/init.d/mca
/etc/httpd/conf.d/apache-mca.conf

%changelog
* Thu Dec 10 2015 Soichi Hayashi <hayashis@iu.edu> 0.8.18.1-0.1
- Initial RPM spec file

