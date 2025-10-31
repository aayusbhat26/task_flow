FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Copy prisma schema from auth-service directory
COPY prisma ./prisma

# Remove postinstall script to avoid errors
RUN npm pkg delete scripts.postinstall

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
