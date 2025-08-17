# Use official Node.js image
FROM node:18-alpine AS builder

# Install yarn
RUN npm install -g yarn

# Set working directory
WORKDIR /app

# Copy package files first
COPY resume-frontend/package.json ./

# Install dependencies with yarn
RUN yarn install --frozen-lockfile --network-timeout 100000

# Copy source code
COPY resume-frontend/ ./

# Build the React app
RUN yarn build

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