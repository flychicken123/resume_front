#!/bin/bash

echo "🚀 Starting frontend deployment..."

# Navigate to frontend application directory
cd ~/ai-resume-frontend

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.frontend.yml down

# Build new images
echo "📦 Building Docker images..."
docker-compose -f docker-compose.frontend.yml build

# Start services
echo "🔄 Starting services..."
docker-compose -f docker-compose.frontend.yml up -d

# Clean up unused images
echo "🧹 Cleaning up unused images..."
docker system prune -f

# Check service status
echo "🔍 Checking service status..."
docker-compose -f docker-compose.frontend.yml ps

echo "✅ Frontend deployment complete!"
echo "🌐 Frontend: http://3.142.69.155:3000"
echo "🔗 Backend API: http://52.14.146.43:8081" 