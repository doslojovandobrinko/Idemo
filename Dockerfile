# Production Dockerfile for Google Cloud Run
FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDependencies required for vite build)
COPY package*.json ./
RUN npm install

# Copy source files and build production assets + compiled server
COPY . .
RUN npm run build

# Runner image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and backend bundles
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 8080

CMD ["node", "server.js"]
