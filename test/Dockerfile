FROM node:12-alpine as build
WORKDIR /usr/app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src src

ENTRYPOINT [ "npm" ]
CMD ["start"]
