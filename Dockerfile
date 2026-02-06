FROM node:18-bullseye-slim AS build

WORKDIR /app

# Install system build tools required by some packages (keeps build robust)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy package manifests and install dependencies (including devDeps for build)
COPY package.json package-lock.json* ./
# Use npm install so build works even when package-lock.json is missing
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production image: nginx serving static files
FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]