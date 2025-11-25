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

# Build backend with full error output
RUN mkdir -p server/dist && \
    echo "=== Building server ===" && \
    cd /app && \
    npm run server:build 2>&1 || (echo "Build failed, showing errors:" && npx tsc -p server/tsconfig.json 2>&1 && exit 1) && \
    echo "=== Build command completed ===" && \
    echo "Checking for dist directory..." && \
    (test -d server/dist && echo "✓ server/dist directory exists" || echo "✗ server/dist directory missing") && \
    (test -d server/dist && find server/dist -type f | head -20 || echo "No files in dist") && \
    if [ ! -d "server/dist" ] || [ -z "$(ls -A server/dist 2>/dev/null)" ]; then \
      echo "ERROR: server/dist is missing or empty after build"; \
      echo "Server structure:"; \
      ls -laR server/ | head -50; \
      echo "Running tsc manually to see errors:"; \
      npx tsc -p server/tsconfig.json 2>&1; \
      exit 1; \
    fi

# Runtime stage
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Install tsx globally for running migration scripts
RUN npm install -g tsx

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
# Create server directory structure first
RUN mkdir -p server/dist server/migrations server/scripts
# Copy server files - use shell to check if dist exists first
RUN --mount=type=bind,from=builder,source=/app/server,target=/mnt/server \
    if [ -d /mnt/server/dist ] && [ -n "$(ls -A /mnt/server/dist 2>/dev/null)" ]; then \
      cp -r /mnt/server/dist/* ./server/dist/ && \
      echo "✓ Copied server/dist successfully"; \
    else \
      echo "ERROR: /app/server/dist does not exist or is empty in builder stage"; \
      echo "Listing /mnt/server contents:"; \
      ls -la /mnt/server/ || true; \
      exit 1; \
    fi
COPY --from=builder /app/server/migrations ./server/migrations
COPY --from=builder /app/server/scripts ./server/scripts

EXPOSE 4000

CMD ["sh", "-c", "npm run server:migrate && npm run server:start"]
