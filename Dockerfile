# Updated Dockerfile for correct repository structure
# Use Ubuntu + Node 18 to match backend OS family and avoid musl differences
FROM ubuntu:22.04 AS base

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18 (LTS) from NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && node -v && npm -v

# Set working directory
WORKDIR /app

# Copy package files from resume-frontend directory
COPY resume-frontend/package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force \
    && npm install --no-package-lock \
    && npm install

# Copy source code from resume-frontend directory
COPY resume-frontend/ .

# Build the React app with environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 