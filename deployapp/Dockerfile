FROM nginx:latest

RUN mkdir /quicknote
COPY dist/* /quicknote
COPY quicknote.conf /etc/nginx/conf.d/
COPY quicknote.nginx.conf.template /etc/nginx/templates/
RUN rm /etc/nginx/conf.d/default.conf
ENV COUCHDB_SERVER=localhost
