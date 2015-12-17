FROM centos:6

RUN yum install -y rpm-build

#install BuildRequires
RUN yum install -y git which postgresql-devel tar

RUN yum install -y epel-release
RUN yum install -y npm
RUN npm install -g --allow-root bower

#for debugging
RUN yum install -y vim man

COPY mca.spec /root/mca.spec
RUN rpmbuild -ba /root/mca.spec

RUN yum install -y /root/rpmbuild/RPMS/x86_64/mca-1.0-1.el6.x86_64.rpm
