FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY public ./public
COPY src ./src
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
