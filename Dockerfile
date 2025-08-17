# Use a lighter base image
FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY resume-frontend/package.json resume-frontend/package-lock.json* ./

# Set memory limits and install dependencies
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV NPM_CONFIG_MAXSOCKETS=3
RUN npm ci --only=production --silent --no-audit --no-fund

# Copy source files
COPY resume-frontend/ ./

# Build the app with memory constraints
RUN npm run build

# Multi-stage build - use smaller runtime image
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=0 /app/build /usr/share/nginx/html

# Simple nginx config for SPA
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Change nginx to listen on port 3000
RUN sed -i 's/listen 80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"] 