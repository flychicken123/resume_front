# Simple Node.js approach
FROM node:18-alpine

WORKDIR /app

# Copy everything
COPY resume-frontend/ ./

# Set NODE_OPTIONS to increase memory and skip problematic checks
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV CI=false

# Install and build in one step to avoid caching issues
RUN npm ci --only=production --no-audit --no-fund && npm run build

# Install serve
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"] 