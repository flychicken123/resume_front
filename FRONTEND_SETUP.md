# 🚀 Frontend Deployment Setup

## 📋 Overview

This guide will help you set up the frontend deployment to EC2 instance `3.142.69.155`.

<!-- Test: Trigger frontend workflow -->
<!-- Second test: Trigger workflow again -->
<!-- Third test: Check Docker build process -->

## 🔧 Step 1: Set Up GitHub Secrets

1. **Go to your GitHub repository**
2. **Click Settings → Secrets and variables → Actions**
3. **Add the following secrets**:

### **Required Secrets:**

```
AWS_ACCESS_KEY_ID=<your-actual-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-actual-aws-secret-key>
FRONTEND_EC2_HOST=3.142.69.155
FRONTEND_EC2_SSH_KEY=<your-actual-private-key-content>
```

**⚠️ Security Note**: Replace the placeholder values with your actual credentials. Never commit real secrets to the repository.

## 🔧 Step 2: Set Up Frontend EC2 Instance

### **Option A: Use the Setup Script**

```bash
# On your frontend EC2 instance (3.142.69.155), run:
curl -fsSL https://raw.githubusercontent.com/your-username/AIResume/main/front/scripts/setup-frontend-ec2.sh | bash
```

### **Option B: Manual Setup**

```bash
# On your frontend EC2 instance:
mkdir -p ~/ai-resume-frontend
cd ~/ai-resume-frontend
git clone https://github.com/your-username/AIResume.git .

# Make deploy script executable
chmod +x scripts/deploy-frontend.sh
```

## 🔧 Step 3: Configure Security Groups

### **Frontend EC2 Security Group:**
- **Inbound Rule**: Port 3000 (HTTP) - Source: 0.0.0.0/0
- **Inbound Rule**: Port 22 (SSH) - Source: Your IP
- **Outbound Rule**: All traffic - Destination: 0.0.0.0/0

## 🚀 Step 4: Deploy Frontend

### **Manual Deployment:**
```bash
# On frontend EC2 instance
cd ~/ai-resume-frontend
./scripts/deploy-frontend.sh
```

### **Automated Deployment:**
1. **Push changes to GitHub** (any changes in `front/` folder)
2. **GitHub Actions will automatically deploy** to frontend EC2

## 📊 Monitoring

### **Check Frontend Status:**
```bash
# On frontend EC2 instance
docker-compose -f docker-compose.frontend.yml ps
docker-compose -f docker-compose.frontend.yml logs -f frontend
```

### **Access Your Frontend:**
- **Frontend**: http://3.142.69.155:3000
- **Backend API**: http://52.14.146.43:8081

## 🔄 Workflow

1. **Make changes** to frontend code locally
2. **Push to GitHub** (`git push origin main`)
3. **GitHub Actions** automatically deploys to frontend EC2
4. **Frontend** is updated automatically

## 📋 File Structure

```
AIResume/
├── front/
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy-frontend.yml
│   ├── scripts/
│   │   ├── deploy-frontend.sh
│   │   └── setup-frontend-ec2.sh
│   ├── resume-frontend/
│   ├── docker-compose.frontend.yml
│   └── FRONTEND_SETUP.md
└── back/
    └── (backend files)
```

## 🚨 Troubleshooting

### **If GitHub Actions fails:**
1. **Check the Actions tab** in your GitHub repository
2. **Verify all secrets** are set correctly
3. **Check EC2 security group** allows SSH from GitHub Actions

### **If frontend deployment fails:**
1. **SSH into frontend EC2** and check logs
2. **Verify Docker containers** are running
3. **Check network connectivity** to backend

## 📞 Support

- **GitHub Actions logs**: Check the Actions tab in your repository
- **Frontend logs**: `docker-compose -f docker-compose.frontend.yml logs -f`
- **Frontend status**: `docker ps` 