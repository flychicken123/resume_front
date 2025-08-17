# Use official Node.js image with latest npm
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy all frontend source code
COPY resume-frontend/ ./

# Install dependencies with simple approach
RUN npm install

# Build the React app
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