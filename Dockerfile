# Use official Node.js image with latest npm
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY resume-frontend/package.json ./
COPY resume-frontend/package-lock.json* ./

# Clear npm cache and install with clean slate
RUN npm cache clean --force
RUN npm install --verbose --no-audit --no-fund || (npm ls && npm install --legacy-peer-deps --verbose)

# Copy source code
COPY resume-frontend/ ./

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