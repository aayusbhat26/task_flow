FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY socket-server/package*.json ./

# Copy prisma schema from root
COPY prisma ../prisma

# Install dependencies
RUN npm install

# Copy source code
COPY socket-server/server.ts ./
COPY socket-server/tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate --schema=../prisma/schema.prisma

# Build TypeScript
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
