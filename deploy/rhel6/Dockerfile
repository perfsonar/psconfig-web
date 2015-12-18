FROM centos:6

RUN yum install -y rpm-build

#install BuildRequires
RUN yum install -y git which postgresql-devel tar

#need epel to install node
RUN yum install -y epel-release

RUN yum install -y npm
RUN npm install -g --allow-root bower

#for debugging
RUN yum install -y vim man wget

COPY mca.spec /root/mca.spec
RUN rpmbuild -bb /root/mca.spec

#installing mca
RUN yum localinstall -y http://yum.postgresql.org/9.4/redhat/rhel-6-x86_64/pgdg-centos94-9.4-1.noarch.rpm
RUN yum install -y /root/rpmbuild/RPMS/x86_64/*

EXPOSE 80 443
