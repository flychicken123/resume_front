# Use Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from resume-frontend directory
COPY resume-frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy source code from resume-frontend directory
COPY resume-frontend/ .

# Build the React app
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 