# Build stage
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY server/tsconfig.json server/tsconfig.json
RUN npm install --omit=dev=false
COPY . .
RUN npm run build
RUN npm run server:build

# Runtime stage
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/migrations ./server/migrations
COPY --from=builder /app/server/scripts ./server/scripts
EXPOSE 4000
CMD ["sh", "-c", "npm run server:migrate && node server/dist/index.js"]
