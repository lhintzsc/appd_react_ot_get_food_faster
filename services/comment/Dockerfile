FROM node:19.7.0-alpine3.17

# set workdir
ARG SERVICE_FOLDER="/service"
WORKDIR ${SERVICE_FOLDER}/

# install dependencies
ADD ./package.json ${SERVICE_FOLDER}/
#RUN npm install -g npm@9.6.1
RUN npm install \
    express \ 
    body-parser \ 
    jsonschema \
    uuid \
    pg-promise

# copy code
ADD ./comment.js ${SERVICE_FOLDER}/

# start the whole shit
EXPOSE 3000
ENTRYPOINT [ "node" ]
CMD ["./comment.js"]