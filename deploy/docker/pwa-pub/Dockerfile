FROM node:6
MAINTAINER Michael Johnson <mj82@globalnoc.iu.edu> 

EXPOSE 8080
CMD ["node", "/app/api/pwapub.js"]

ADD tmp/ /app
RUN cd /app && npm install --production

