FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY index.html postcss.config.js tailwind.config.js tsconfig.json vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV GDF_DB_PATH=/app/gdf_sovereign.db
COPY --from=builder /app/dist ./dist
COPY server.mjs ./server.mjs
COPY gdf_sovereign.db ./gdf_sovereign.db
EXPOSE 8080
CMD ["node", "server.mjs"]
