FROM mongo:4.2-bionic
COPY wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it
COPY downgrade_mongodb.js downgrade_mongodb.js
COPY start.sh start.sh
CMD ./start.sh