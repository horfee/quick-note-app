FROM nginx

RUN mkdir /quicknote
COPY dist/* /quicknote
COPY quicknote.conf /etc/nginx/conf.d/
RUN rm /etc/nginx/conf.d/default.conf