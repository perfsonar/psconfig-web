FROM centos:7

COPY x86_64 /x86_64

RUN yum install -y vim wget curl htop

#for node
RUN yum install -y epel-release 
RUN yum install -y /x86_64/*

EXPOSE 80 443 9443
