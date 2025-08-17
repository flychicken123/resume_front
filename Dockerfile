# Use official Node.js image for better compatibility
FROM node:18-alpine AS builder

# Install python and build tools needed for some npm packages
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files from resume-frontend directory
COPY resume-frontend/package.json ./
COPY resume-frontend/package-lock.json ./

# Clear npm cache and install dependencies with retries
RUN npm cache clean --force && \
    npm config set registry https://registry.npmjs.org/ && \
    npm install --no-package-lock --legacy-peer-deps || \
    npm install --force

# Copy source code from resume-frontend directory
COPY resume-frontend/ .

# Build the React app with environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/build ./build

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 