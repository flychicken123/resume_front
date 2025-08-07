#!/bin/bash

# Deploy updated Nginx configuration to fix 502 Bad Gateway error
echo "🚀 Deploying updated Nginx configuration..."

# Copy the updated nginx.conf to the server
scp -i ~/.ssh/your-key.pem nginx.conf ec2-user@3.142.69.155:/tmp/nginx.conf

# SSH into the server and update Nginx
ssh -i ~/.ssh/your-key.pem ec2-user@3.142.69.155 << 'EOF'
    echo "📋 Updating Nginx configuration..."
    
    # Backup current config
    sudo cp /etc/nginx/conf.d/hihired.org.conf /etc/nginx/conf.d/hihired.org.conf.backup
    
    # Copy new config
    sudo cp /tmp/nginx.conf /etc/nginx/conf.d/hihired.org.conf
    
    # Test Nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
        
        # Reload Nginx
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
        
        # Check if frontend container is running
        echo "🔍 Checking frontend container status..."
        docker ps | grep frontend
        
        if [ $? -ne 0 ]; then
            echo "⚠️  Frontend container not running, restarting..."
            cd ~/ai-resume-frontend
            docker-compose -f docker-compose.frontend.yml down
            docker-compose -f docker-compose.frontend.yml up -d
            echo "✅ Frontend container restarted"
        else
            echo "✅ Frontend container is running"
        fi
        
    else
        echo "❌ Nginx configuration test failed"
        exit 1
    fi
EOF

echo "✅ Nginx deployment completed!" 