FROM node:8
LABEL org.opencontainers.image.authors="John Grigutis <grigutis@globalnoc.iu.edu>" 

EXPOSE 8080
CMD ["node", "/app/api/pwapub.js"]

ADD tmp/ /app
RUN cd /app && npm install --production

