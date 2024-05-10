FROM alpine:latest
FROM node:22-alpine

# Create app directory
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app
EXPOSE 4500

CMD ["node", "app.js" ]
