# Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Copy types.ts to server/src to satisfy rootDir constraint
RUN cp types.ts server/src/

# Update server tsconfig - create a new one that doesn't extend parent
RUN cat > server/tsconfig.json << TSCONFIG
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2022",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "skipLibCheck": true,
    "noEmit": false
  },
  "include": ["./src/**/*.ts"]
}
TSCONFIG

# Update imports - now it's one level up from utils/
RUN sed -i "s|from '../../types.js'|from '../types.js'|g" server/src/utils/serializers.ts
RUN sed -i "s|from '../../types.js'|from '../types.js'|g" server/src/utils/validation.ts

# Fix type assertions in serializers
RUN sed -i 's|situation: row.situation,|situation: row.situation as any,|g' server/src/utils/serializers.ts
RUN sed -i 's|neurotypes: row.neurotypes,|neurotypes: row.neurotypes as any,|g' server/src/utils/serializers.ts

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
