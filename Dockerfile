# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build frontend
RUN npm run build

# Build backend
RUN npm run server:build

# Runtime stage
FROM node:20-slim
WORKDIR /app

# Don't set NODE_ENV yet, install all dependencies first
COPY package*.json ./
RUN npm install

# Now set NODE_ENV for runtime
ENV NODE_ENV=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/migrations ./server/migrations
COPY --from=builder /app/server/scripts ./server/scripts

EXPOSE 4000

CMD ["sh", "-c", "npm run server:migrate && npm run server:start"]
