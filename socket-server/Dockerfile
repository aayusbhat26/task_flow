FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY socket-server/package*.json ./

# Copy root package.json to resolve "file:.." dependency
COPY package.json /package.json

# Remove postinstall script to prevent premature prisma generate
RUN sed -i '/postinstall/d' package.json

# Copy prisma schema from root
COPY prisma ../prisma

# Install dependencies
RUN npm install --ignore-scripts --legacy-peer-deps

# Install prisma CLI explicitly to ensure it's available
RUN npm install -g prisma@5.22.0

# Copy source code
COPY socket-server/server.ts ./
COPY socket-server/tsconfig.json ./

# Set environment variable to skip auto-install
ENV PRISMA_SKIP_AUTO_INSTALL_BINARY=true

# Generate Prisma client using the global binary directly
RUN prisma generate --schema=../prisma/schema.prisma

# Build TypeScript
RUN npm run build

EXPOSE 3002

CMD ["node", "dist/server.js"]
