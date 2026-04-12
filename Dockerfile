# Use Node.js 22 (required by Vite 8: node ^20.19.0 || >=22.12.0)
FROM node:22-bookworm AS base

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

# Build the app with environment variables
ARG REACT_APP_API_URL
ENV VITE_API_URL=$REACT_APP_API_URL
RUN npm run build --loglevel verbose \
    || (echo "npm build failed; dumping npm-debug.log (if any)" \
        && if [ -f npm-debug.log ]; then cat npm-debug.log; fi \
        && exit 1)

# Install serve to run the built app
RUN npm install -g serve

EXPOSE 3000

# Vite outputs to dist/ instead of build/
CMD ["serve", "-s", "dist", "-l", "3000"]
