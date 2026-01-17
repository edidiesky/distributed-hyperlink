# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies
RUN apk add --no-cache curl && npm ci 
# Copy source files
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npx tsc

# Production stage
FROM node:18-alpine

WORKDIR /app
RUN apk add --no-cache curl
# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
USER nodejs

# Expose port
EXPOSE 4002

CMD ["node", "dist/server.js"]