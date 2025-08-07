# 🔍 Diagnostic Commands for 502 Bad Gateway Error

Run these commands on your frontend EC2 instance (3.142.69.155) to diagnose the issue:

## 1. Check Nginx Status
```bash
sudo systemctl status nginx
```

## 2. Check Docker Containers
```bash
docker ps -a
```

## 3. Check if Frontend Container is Running
```bash
docker ps | grep frontend
```

## 4. Check Nginx Configuration
```bash
sudo nginx -t
```

## 5. Check Nginx Error Logs
```bash
sudo tail -20 /var/log/nginx/error.log
```

## 6. Check if Port 3000 is Listening
```bash
netstat -tlpn | grep :3000
```

## 7. Test Local Connection to Frontend
```bash
curl -I http://localhost:3000
```

## 8. Check Disk Space
```bash
df -h
```

## 9. Check Memory Usage
```bash
free -h
```

## 10. Restart Frontend Container (if needed)
```bash
cd ~/ai-resume-frontend
docker-compose -f docker-compose.frontend.yml down
docker-compose -f docker-compose.frontend.yml up -d
```

## 11. Reload Nginx Configuration
```bash
sudo systemctl reload nginx
```

## 12. Check Nginx Configuration File
```bash
sudo cat /etc/nginx/conf.d/hihired.org.conf
```

---

## 🚨 Most Likely Issues:

1. **Frontend container stopped** - Run command #10 to restart
2. **Nginx configuration error** - Check command #4 and #12
3. **Port 3000 not accessible** - Check command #6
4. **Disk space full** - Check command #8

## 🔧 Quick Fix Commands:

If frontend container is not running:
```bash
cd ~/ai-resume-frontend
docker-compose -f docker-compose.frontend.yml up -d
```

If Nginx has issues:
```bash
sudo systemctl restart nginx
```

If both are down:
```bash
cd ~/ai-resume-frontend
docker-compose -f docker-compose.frontend.yml down
docker-compose -f docker-compose.frontend.yml up -d
sudo systemctl restart nginx
``` 