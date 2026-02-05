FROM node:18-alpine

WORKDIR /usr/src/app

# Only install production deps for runtime image
COPY backend/package.json backend/package-lock.json* ./ 
RUN npm ci --production --legacy-peer-deps

# Copy backend sources
COPY backend/ .

# Ensure uploads dir exists
RUN mkdir -p /usr/src/app/uploads

EXPOSE 3000

# Start the server
CMD ["node", "server.js"]