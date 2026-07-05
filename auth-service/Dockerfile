# Multi-stage production Dockerfile for Auth Microservice
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat make gcc g++ python3

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm install --legacy-peer-deps

# Rebuild bcrypt to ensure it matches the container architecture
RUN npm rebuild bcrypt --build-from-source

# Generate Prisma Client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code and tsconfig
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript to Javascript
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps

# Copy compiled build output, generated prisma clients, and built native modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/bcrypt ./node_modules/bcrypt

EXPOSE 3003

CMD ["node", "dist/index.js"]
