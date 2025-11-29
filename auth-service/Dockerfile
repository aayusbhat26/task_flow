FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package files
COPY package.json ./package.json
COPY auth-service/package*.json ./auth-service/

# Copy root package.json to resolve "file:.." dependency
# COPY package.json /package.json

 # Remove postinstall script to prevent premature prisma generate
# RUN sed -i '/postinstall/d' package.json

# Copy prisma schema from root
COPY prisma ../prisma

# Install dependencies
RUN npm install --ignore-scripts --legacy-peer-deps

# Install prisma CLI explicitly to ensure it's available
# RUN npm install -g prisma@5.22.0



# Set environment variable to skip auto-install
# ENV PRISMA_SKIP_AUTO_INSTALL_BINARY=true

# Generate Prisma client using the global binary directly
RUN npx prisma generate --schema=../prisma/schema.prisma

# Copy source code
COPY auth-service/src ./src
COPY auth-service/tsconfig.json ./

# Build TypeScript
RUN npm run build --workspace=auth-service

EXPOSE 3003

CMD ["npm", "start"]
