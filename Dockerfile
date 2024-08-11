FROM node:20-alpine

WORKDIR /home/node/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN chown -R node:node /home/node/app

EXPOSE 3000
USER node

CMD ["node", "server.js"]

