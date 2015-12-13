Name: mca
Version: 1.0
Release: 1%{?dist}
Summary: Meshconfig administration web UI and publisher

License: MIT
URL: https://github.com/soichih/meshconfig-admin

BuildRequires: git
BuildRequires: npm

Requires: httpd
Requires: postgresql
Requires: postgresql-server
Requires: postgresql-devel
Requires: sqlite
Requires: sqlite-devel

%description
This application allows perfSONAR toolkit adminitrators to define / 
edit MeshConfig and publish JSON to be consumed by various perfSONAR services.

%pre

%prep

%build

%check

%install
rm -rf $RPM_BUILD_ROOT
mkdir -p $RPM_BUILD_ROOT/opt/mca
git clone https://github.com/soichih/meshconfig-admin.git $RPM_BUILD_ROOT/opt/mca/mca
git clone https://github.com/soichih/sca-auth.git $RPM_BUILD_ROOT/opt/mca/auth
git clone https://github.com/soichih/sca-shared.git $RPM_BUILD_ROOT/opt/mca/shared
git clone https://github.com/soichih/sca-profile.git $RPM_BUILD_ROOT/opt/mca/profile

#cd $RPM_BUILD_ROOT/opt/mca/mca && npm install
#cd $RPM_BUILD_ROOT/opt/mca/auth && npm install
#cd $RPM_BUILD_ROOT/opt/mca/shared && npm install
#cd $RPM_BUILD_ROOT/opt/mca/profile && npm install

#cp $RPM_BUILD_ROOT/opt/mca/meshconfig/rhel6/mca.init $RPM_BUILD_ROOT/etc/init.d/mca

mkdir -p $RPM_BUILD_ROOT/etc/httpd/conf.d
ln -sf /opt/mca/mca/deploy/apache-mca.conf $RPM_BUILD_ROOT/etc/httpd/conf.d/apache-mca.conf

#install configs
cp -r $RPM_BUILD_ROOT/opt/mca/mca/deploy/conf  $RPM_BUILD_ROOT/opt/mca

echo "done installing"

%post

echo "this gets run after install right?"

%clean
[ "$RPM_BUILD_ROOT" != "/" ] && rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,root,root)
#%doc README TODO COPYING ChangeLog
%config(noreplace) /opt/mca/mca/api/config
%config(noreplace) /opt/mca/mca/ui/config.js
%config(noreplace) /opt/mca/auth/api/config
%config(noreplace) /opt/mca/auth/ui/config.js
%config(noreplace) /opt/mca/shared/api/config
%config(noreplace) /opt/mca/shared/ui/config.js
%config(noreplace) /opt/mca/profile/api/config
%config(noreplace) /opt/mca/profile/ui/config.js
#/etc/init.d/mca
/opt/mca
/etc/httpd/conf.d/apache-mca.conf

%changelog
* Thu Dec 10 2015 Soichi Hayashi <hayashis@iu.edu> 0.8.18.1-0.1
- Initial RPM spec file

