FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY auth-service/package*.json ./

# Copy root package.json to resolve "file:.." dependency
COPY package.json /package.json

# Remove postinstall script to prevent premature prisma generate
RUN sed -i '/postinstall/d' package.json

# Copy prisma schema from root
COPY prisma ../prisma

# Install dependencies
RUN npm install

# Copy source code
COPY auth-service/src ./src
COPY auth-service/tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate --schema=../prisma/schema.prisma

# Build TypeScript
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
