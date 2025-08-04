#!/bin/bash

echo "🔧 Setting up EC2 for AI Resume Builder Frontend..."

# Update system
sudo yum update -y

# Install essential packages
sudo yum install -y curl wget git htop unzip

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create frontend application directory
mkdir -p ~/ai-resume-frontend
cd ~/ai-resume-frontend

# Clone the repository
echo "📥 Cloning repository..."
git clone https://github.com/your-username/AIResume.git .

# Make deploy script executable
chmod +x scripts/deploy-frontend.sh

echo "✅ Frontend EC2 setup complete!"
echo "📋 Next steps:"
echo "1. Run: ./scripts/deploy-frontend.sh"
echo ""
echo "🔗 Your frontend will be available at:"
echo "   Frontend: http://3.142.69.155:3000"
echo "   Backend API: http://52.14.146.43:8081" 