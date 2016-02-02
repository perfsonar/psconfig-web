FROM soichih/mca

RUN yum install -y rpm-build

#need epel to install node (which is then needed to build the rpm)
#RUN yum install -y epel-release

COPY mca.spec /root/mca.spec
RUN rpmbuild -bb /root/mca.spec
