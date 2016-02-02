openssl genrsa -out auth.key 1024
openssl rsa -in auth.key -pubout > auth.pub
