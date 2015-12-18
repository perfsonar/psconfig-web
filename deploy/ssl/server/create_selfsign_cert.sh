openssl genrsa -des3 -out self.key 1024
openssl req -new -key self.key -out self.csr

#remove passphrase
cp self.key self.key.org
openssl rsa -in self.key.org -out self.key

openssl x509 -req -days 365 -in self.csr -signkey self.key -out self.crt
