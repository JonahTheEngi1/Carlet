FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy source, build
COPY . .
ARG VITE_BASE44_APP_ID
ARG VITE_BASE44_FUNCTIONS_VERSION
ARG VITE_BASE44_APP_BASE_URL
ENV VITE_BASE44_APP_ID=${VITE_BASE44_APP_ID}
ENV VITE_BASE44_FUNCTIONS_VERSION=${VITE_BASE44_FUNCTIONS_VERSION}
ENV VITE_BASE44_APP_BASE_URL=${VITE_BASE44_APP_BASE_URL}

RUN npm run build

# Runtime image
FROM nginx:stable-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]