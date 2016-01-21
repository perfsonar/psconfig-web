FROM centos:7
MAINTAINER Soichi Hayashi <hayashis@iu.edu>

RUN yum install -y epel-release
RUN yum install -y git tar whichi

RUN yum install -y sqlite sqlite-devel 

#install npm & bower
RUN yum install -y npm
RUN npm install -g npm pm2
RUN npm install -g --allow-root bower

#install apache
RUN yum install -y httpd mod_ssl

#for debugging
RUN yum install -y vim man wget telnet which

#install git repos
RUN mkdir -p /opt/mca
RUN git clone https://github.com/soichih/meshconfig-admin.git /opt/mca/mca
RUN git clone https://github.com/soichih/sca-auth.git /opt/mca/auth
RUN git clone https://github.com/soichih/sca-profile.git /opt/mca/profile
RUN git clone https://github.com/soichih/sca-shared.git /opt/mca/shared

#install pm2 script
COPY mca.json /opt/mca/

#install npm modules
RUN yum install -y postgresql-devel make
RUN npm install -g node-gyp
RUN cd /opt/mca/mca && npm install --production
RUN cd /opt/mca/auth && npm install --production
RUN cd /opt/mca/shared && npm install --production
RUN cd /opt/mca/profile && npm install --production

#install bower
RUN cd /opt/mca/mca/ui && bower install --allow-root
RUN cd /opt/mca/auth/ui && bower install --allow-root
RUN cd /opt/mca/shared/ui && bower install --allow-root
RUN cd /opt/mca/profile/ui && bower install --allow-root

#install test ssl certs
COPY ssl/server/self.key.pem /etc/grid-security/http/
COPY ssl/server/self.cert.pem /etc/grid-security/http/

#install configs
COPY conf/mca /opt/mca/mca
COPY conf/auth /opt/mca/auth
COPY conf/shared /opt/mca/shared
COPY conf/profile /opt/mca/profile

#install apache config
COPY apache-mca.conf /etc/httpd/conf.d/mca.conf
RUN mv /etc/httpd/conf.d/ssl.conf /etc/httpd/conf.d/ssl.conf.disabled

#install igtf certs
RUN mkdir -p /etc/grid-security/certificates
RUN cd /etc/grid-security/certificates && wget https://dist.igtf.net/distribution/current/accredited/igtf-preinstalled-bundle-classic.tar.gz && tar -xzf *.tar.gz
RUN ls /etc/grid-security/certificates

#to be organized
RUN mkdir -p /var/lib/mca/
RUN mkdir -p /var/log/mca/

COPY boot.sh /
CMD ["/boot.sh"]
