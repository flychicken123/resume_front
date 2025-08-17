# Use a base image that already has serve installed
FROM node:18-alpine

WORKDIR /app

# Copy source files
COPY resume-frontend/ ./

# Build without installing dev dependencies
RUN npm install --production=false && npm run build

# Remove node_modules to save space
RUN rm -rf node_modules

# Install only serve globally
RUN npm install -g serve@14.2.0

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 