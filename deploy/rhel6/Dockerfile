FROM centos:6

RUN yum install -y rpm-build

#need epel to install node (which is then needed to build the rpm)
RUN yum install -y epel-release

#install BuildRequires
RUN yum install -y git which postgresql-devel tar make npm
RUN npm install -g --allow-root bower

#for debugging
#RUN yum install -y vim man wget telnet

COPY _common/mca.spec /root/mca.spec
RUN rpmbuild -bb /root/mca.spec


