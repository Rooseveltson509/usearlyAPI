FROM node:14-slim

WORKDIR /usr/src/app

COPY ./package.json ./

RUN npm install &&\
    npm install -g sequelize-cli

COPY . .

EXPOSE 3000

CMD [ "node", "server.js" ]