#!/bin/bash

echo "🔧 Deploying Nginx configuration fix for Mixed Content issue..."

# Copy the updated Nginx configuration to the server
echo "📤 Copying Nginx configuration..."
scp -i ~/.ssh/flybird.pem nginx.conf ec2-user@3.142.69.155:/tmp/nginx.conf

# SSH into the server and apply the configuration
echo "🔧 Applying Nginx configuration..."
ssh -i ~/.ssh/flybird.pem ec2-user@3.142.69.155 << 'EOF'
    # Backup current configuration
    sudo cp /etc/nginx/conf.d/hihired.org.conf /etc/nginx/conf.d/hihired.org.conf.backup
    
    # Copy new configuration
    sudo cp /tmp/nginx.conf /etc/nginx/conf.d/hihired.org.conf
    
    # Test Nginx configuration
    sudo nginx -t
    
    if [ $? -eq 0 ]; then
        echo "✅ Nginx configuration is valid"
        # Reload Nginx
        sudo systemctl reload nginx
        echo "✅ Nginx reloaded successfully"
    else
        echo "❌ Nginx configuration is invalid, reverting..."
        sudo cp /etc/nginx/conf.d/hihired.org.conf.backup /etc/nginx/conf.d/hihired.org.conf
        sudo systemctl reload nginx
    fi
EOF

echo "✅ Nginx configuration fix deployed!"
echo ""
echo "📋 Next steps:"
echo "1. Deploy the updated frontend with new API URL"
echo "2. Deploy the updated backend with new CORS headers"
echo "3. Test the application to ensure Mixed Content issue is resolved" 