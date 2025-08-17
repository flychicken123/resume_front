# Use official Node.js image for better compatibility
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from resume-frontend directory
COPY resume-frontend/package.json ./
COPY resume-frontend/package-lock.json ./

# Install dependencies with clean install
RUN npm ci --only=production || npm install --production

# Copy source code from resume-frontend directory
COPY resume-frontend/ .

# Install ALL dependencies (including dev) for building
RUN npm install

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