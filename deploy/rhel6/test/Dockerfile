FROM centos:6

COPY x86_64 /x86_64

RUN yum install vim wget curl htop

RUN yum install -y epel-release
RUN yum install -y http://yum.postgresql.org/9.4/redhat/rhel-6-x86_64/pgdg-centos94-9.4-1.noarch.rpm
RUN yum install -y /x86_64/*


EXPOSE 80 443 9443
