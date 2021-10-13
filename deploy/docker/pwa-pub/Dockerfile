FROM node:6

EXPOSE 8080
CMD ["node", "/app/api/pwapub.js"]

ADD tmp/ /app
RUN cd /app && npm install --production

