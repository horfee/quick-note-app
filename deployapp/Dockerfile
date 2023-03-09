FROM nginx:latest

RUN mkdir /quicknote
COPY dist /quicknote
#COPY quicknote.conf /etc/nginx/conf.d/
COPY quicknote.nginx.conf.template /etc/nginx/templates/
RUN rm /etc/nginx/conf.d/default.conf
ENV COUCHDB_SCHEME=HTTP
ENV COUCHDB_HOST=localhost
ENV COUCHDB_PORT=5984
ENV MAX_FILE_SIZE=100M;