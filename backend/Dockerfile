FROM node:18-bullseye-slim

WORKDIR /usr/src/app

# Install production dependencies
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --production --legacy-peer-deps

# Copy backend sources
COPY backend/ .

# Ensure uploads dir exists
RUN mkdir -p /usr/src/app/uploads

EXPOSE 3000

CMD ["node", "server.js"]