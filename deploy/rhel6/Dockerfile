FROM centos:6

RUN yum install -y rpm-build

#install BuildRequires
RUN yum install -y git which postgresql-devel tar

RUN yum install -y epel-release
RUN yum install -y npm
RUN npm install -g --allow-root bower

COPY mca.spec /root/mca.spec
RUN rpmbuild -ba /root/mca.spec

