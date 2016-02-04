FROM node

ENV SOURCE_DIR /usr/src
RUN mkdir -p $SOURCE_DIR && cd $SOURCE_DIR
WORKDIR $SOURCE_DIR

# Copy files needed for npm and bower
COPY package.json $SOURCE_DIR/

#############################################################
#### Although RUN commands are better when run together, ####
#### these were split up so that docker could cache the  ####
#### installed dependencies from npm and bower.          ####
#############################################################

RUN npm install --production && \
    npm config set production

COPY dist $SOURCE_DIR/dist

EXPOSE 4000

CMD ["node", "dist/server.js"]
