# Diagnostic script to check frontend server status
Write-Host "🔍 Diagnosing 502 Bad Gateway error..." -ForegroundColor Green

# SSH command to check server status
$sshCommand = @"
echo "📊 System Status:"
echo "=================="

# Check if Nginx is running
echo "🔍 Nginx Status:"
sudo systemctl status nginx --no-pager -l

# Check if frontend container is running
echo "🔍 Docker Containers:"
docker ps -a

# Check Nginx configuration
echo "🔍 Nginx Configuration Test:"
sudo nginx -t

# Check Nginx error logs
echo "🔍 Nginx Error Logs (last 20 lines):"
sudo tail -20 /var/log/nginx/error.log

# Check if port 3000 is listening
echo "🔍 Port 3000 Status:"
netstat -tlpn | grep :3000

# Test local connection to frontend
echo "🔍 Testing local connection to frontend:"
curl -I http://localhost:3000

# Check disk space
echo "🔍 Disk Space:"
df -h

# Check memory usage
echo "🔍 Memory Usage:"
free -h
"@

# Execute the SSH command
Write-Host "Connecting to server..." -ForegroundColor Yellow
ssh -i ~/.ssh/your-key.pem ec2-user@3.142.69.155 $sshCommand

Write-Host "✅ Diagnostic completed!" -ForegroundColor Green 