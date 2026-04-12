# Use official Node.js 18 image (Debian-based, not Alpine)
FROM node:18-bullseye AS base

# Install Chromium dependencies for react-snap prerendering
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell react-snap to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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

# Build the React app with environment variables (includes react-snap + fix-canonical)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build --loglevel verbose \
    || (echo "npm build failed; dumping npm-debug.log (if any)" \
        && if [ -f npm-debug.log ]; then cat npm-debug.log; fi \
        && exit 1)

# Install serve to run the built app
RUN npm install -g serve

EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
