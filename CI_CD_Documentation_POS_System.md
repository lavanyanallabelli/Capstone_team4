# 📘 CI/CD Process & GitHub Repository Documentation  
**Project:** POS System – Capstone Team 4  
**CI/CD Tool:** Jenkins  
**Containerization:** Docker  
**Deployment Target:** AWS EC2 (DEV)  
**Repository:** Capstone_team4  
**Primary Branch:** `prod`  
**Jenkinsfile Location:** Root directory as `Jenkinsfile`

---

## 📋 Table of Contents

1. [GitHub Repository Overview](#1-github-repository-overview)
2. [CI/CD Architecture Overview](#2-cicd-architecture-overview)
3. [Jenkins Pipeline Configuration](#3-jenkins-pipeline-configuration)
4. [Pipeline Stages - Detailed Flow](#4-pipeline-stages---detailed-flow)
5. [Environment Variables](#5-environment-variables)
6. [Docker Configuration](#6-docker-configuration)
7. [Deployment Process](#7-deployment-process)
8. [Notifications & Monitoring](#8-notifications--monitoring)
9. [Jenkins Plugins Required](#9-jenkins-plugins-required)
10. [Jenkins Credentials Setup](#10-jenkins-credentials-setup)
11. [Troubleshooting](#11-troubleshooting)

---

## 1️⃣ GitHub Repository Overview

### Repository URL
**https://github.com/lavanyanallabelli/Capstone_team4**

### 📁 Repository Structure
```
Capstone_team4/
├── code/
│   ├── client/                    # React Frontend Application
│   │   ├── Dockerfile            # Frontend container configuration
│   │   ├── src/                  # React source code
│   │   ├── public/               # Static assets
│   │   ├── package.json          # Frontend dependencies
│   │   └── build/                # Production build output (generated)
│   └── server/                   # Node.js Backend Application
│       ├── Dockerfile            # Backend container configuration
│       ├── server.js             # Main server entry point
│       ├── package.json          # Backend dependencies
│       └── .env                  # Environment variables (on EC2)
├── Jenkinsfile                   # Main CI/CD Pipeline (from Jenkinsfiletest.ec2)
├── Jenkinsfile.qa.ec2            # QA Environment Pipeline (if exists)
└── README.md                     # Project documentation
```

### 🌿 Available Branches
- `prod` - Production branch (primary deployment)
- `QA` - Quality Assurance branch
- `main` - Main development branch

---

## 2️⃣ CI/CD Architecture Overview

### Pipeline Flow Diagram
```
GitHub Repository
    ↓
[1] Checkout Code (Branch Selection: prod/QA/main)
    ↓
[2] Install Dependencies (npm install:all)
    ↓
[3] Set Frontend Environment Variables
    ↓
[4] Build React Application (npm run build:client)
    ↓
[5] Build Docker Images (Frontend & Backend)
    ↓
[6] Push Images to Docker Hub
    ↓
[7] Deploy Frontend to EC2 (SSH + PM2)
    ↓
[8] Deploy Backend to EC2 (SSH + PM2)
    ↓
[9] Post-Build Actions
    ├── Success: Slack + Email Notification
    ├── Failure: Slack + Email Notification
    └── Always: Health Report + Workspace Cleanup
```

### Key Features
- ✅ Automated branch-based builds
- ✅ Docker containerization for consistency
- ✅ Docker Hub image registry
- ✅ Zero-downtime deployment with PM2
- ✅ Real-time Slack notifications
- ✅ Email notifications with build details
- ✅ Jenkins health monitoring
- ✅ Automatic workspace cleanup

---

## 3️⃣ Jenkins Pipeline Configuration

### 🔧 Jenkins Agent
```groovy
agent { label 'docker-slave' }
```
- **Agent Label:** `docker-slave`
- **Requirements:** Docker, Node.js, npm, Git, SSH client

### 📦 Build Parameters
The pipeline accepts a **branch parameter** at build time:
```groovy
parameters {
    choice(
        name: 'BRANCH',
        choices: ['prod', 'QA', 'main'],
        description: 'Select the branch to build'
    )
}
```

### 🔄 Build Trigger
- **Manual:** Triggered manually with branch selection
- **Automatic:** Can be configured with GitHub webhooks (optional)

---

## 4️⃣ Pipeline Stages - Detailed Flow

### Stage 1: Checkout from GitHub
```groovy
git branch: "${params.BRANCH}", url: 'https://github.com/lavanyanallabelli/Capstone_team4.git'
```

**Actions:**
- Clones selected branch from GitHub
- Extracts commit metadata:
  - `LAST_COMMIT_MESSAGE` - Latest commit message
  - `LAST_COMMIT_AUTHOR` - Commit author name
  - `LAST_COMMIT_HASH` - Short commit hash (7 characters)
- Creates Docker image tag: `{BUILD_NUMBER}-{COMMIT_HASH}`

**Output Environment Variables:**
- `env.LAST_COMMIT_MESSAGE`
- `env.LAST_COMMIT_AUTHOR`
- `env.LAST_COMMIT_HASH`
- `env.DOCKER_IMAGE_TAG` (e.g., `190-c5cff37`)

---

### Stage 2: Install Dependencies
```bash
npm run install:all
cd client && npm install path-exists --save
cd ../server && npm install path-exists --save
```

**Actions:**
- Installs all project dependencies (root, client, server)
- Installs `path-exists` package for both client and server
- Uses npm cache for faster builds (if available)

**Location:** `code/` directory

---

### Stage 3: Set Frontend Environment
Creates `.env` file in `code/client/` directory with React environment variables.

**Environment Variables Set:**
- `REACT_APP_AWS_REGION`
- `REACT_APP_USER_POOL_ID`
- `REACT_APP_USER_POOL_WEB_CLIENT_ID`
- `REACT_APP_OAUTH_DOMAIN`
- `REACT_APP_API_URL`
- `REACT_APP_REDIRECT_SIGN_IN`
- `REACT_APP_REDIRECT_SIGN_OUT`

**Note:** These are baked into the React build at compile time.

---

### Stage 4: Build React Application
```bash
npm run build:client
```

**Actions:**
- Compiles React application for production
- Outputs optimized build files to `code/client/build/`
- Includes environment variables from `.env` file

**Build Output:** `code/client/build/` directory

---

### Stage 5: Build Docker Images

#### Frontend Docker Image
```bash
docker build -t lavanyanallabelli/pos-system-frontend:{TAG} \
             -t lavanyanallabelli/pos-system-frontend:latest \
             -f code/client/Dockerfile code/client/
```

#### Backend Docker Image
```bash
docker build -t lavanyanallabelli/pos-system-backend:{TAG} \
             -t lavanyanallabelli/pos-system-backend:latest \
             -f code/server/Dockerfile code/server/
```

**Image Tags:**
- `{BUILD_NUMBER}-{COMMIT_HASH}` - Versioned tag
- `latest` - Latest tag for easy deployment

**Docker Hub Repository:** `lavanyanallabelli/pos-system`

**Fallback:** If Dockerfile path fails, attempts build without `-f` flag.

---

### Stage 6: Push Docker Images to Docker Hub

**Authentication:**
- Uses Jenkins credential ID: `dockerhub-creds`
- Credential type: `usernamePassword`
- Variables: `DOCKER_USER`, `DOCKER_PASS`

**Actions:**
1. Logs into Docker Hub
2. Pushes frontend image (both tags)
3. Pushes backend image (both tags)

**Pushed Images:**
- `lavanyanallabelli/pos-system-frontend:{TAG}`
- `lavanyanallabelli/pos-system-frontend:latest`
- `lavanyanallabelli/pos-system-backend:{TAG}`
- `lavanyanallabelli/pos-system-backend:latest`

---

### Stage 7: Deploy Frontend to DEV EC2

**Target Server:** `54.242.45.110`

**SSH Credentials:**
- Credential ID: `AWS_DEV_SSH_KEY`
- Credential type: `sshUserPrivateKey`
- Variables: `SSH_KEY`, `SSH_USER`

**Deployment Steps:**
1. Creates directory: `/home/ec2-user/pos_system/build`
2. Copies build files: `code/client/build/*` → EC2
3. Stops existing PM2 process: `pm2 stop pos-system`
4. Starts PM2 serve: `pm2 serve /home/ec2-user/pos_system/build 3000 --name pos-system --spa`
5. Saves PM2 configuration: `pm2 save`
6. Configures PM2 startup (if needed)

**Frontend Access:** Port 3000 with SPA (Single Page Application) routing

---

### Stage 8: Deploy Backend to DEV EC2

**Target Server:** `54.242.45.110`

**Deployment Steps:**
1. Verifies SSH connection
2. Creates directory: `/home/ec2-user/pos_system/server`
3. Copies server files: `code/server/*` → EC2
4. **Note:** Uses existing `.env` file on EC2 (not overwritten)
5. Installs dependencies: `npm install` (on EC2)
6. Stops existing backend: `pm2 delete pos-backend`
7. Starts backend: `pm2 start server.js --name pos-backend`
8. Saves PM2 configuration: `pm2 save`

**Backend Access:** Port 5000 (default Node.js server port)

**Environment Variables:** Managed on EC2 instance (not from Jenkins)

---

## 5️⃣ Environment Variables

### Pipeline Environment Variables

#### Frontend (React) Environment Variables
| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_AWS_REGION` | `us-east-1` | AWS Region for Cognito |
| `REACT_APP_USER_POOL_ID` | `us-east-1_i2eRulYnD` | Cognito User Pool ID |
| `REACT_APP_USER_POOL_WEB_CLIENT_ID` | `3q99asqjvgb0eakf80eorms0ho` | Cognito Client ID |
| `REACT_APP_OAUTH_DOMAIN` | `https://us-east-1i2erulynd.auth.us-east-1.amazoncognito` | OAuth domain |
| `REACT_APP_API_URL` | `http://54.242.45.110:5000/api` | Backend API URL |
| `REACT_APP_REDIRECT_SIGN_IN` | `http://54.242.45.110.112/` | Sign-in redirect URL |
| `REACT_APP_REDIRECT_SIGN_OUT` | `http://54.242.45.110.112/` | Sign-out redirect URL |

#### Docker Configuration
| Variable | Value | Description |
|----------|-------|-------------|
| `DOCKER_HUB_REPO` | `lavanyanallabelli/pos-system` | Docker Hub repository name |

#### Build-Generated Variables
| Variable | Format | Description |
|----------|--------|-------------|
| `BUILD_NUMBER` | `190` | Jenkins build number |
| `DOCKER_IMAGE_TAG` | `190-c5cff37` | Build number + commit hash |
| `LAST_COMMIT_HASH` | `c5cff37` | Short Git commit hash |
| `LAST_COMMIT_AUTHOR` | `Chetan Jogi` | Commit author name |
| `LAST_COMMIT_MESSAGE` | Commit message | Latest commit message |
| `BUILD_URL` | Jenkins build URL | Link to build console |
| `NODE_NAME` | `docker-slave` | Jenkins agent/node name |

---

## 6️⃣ Docker Configuration

### Docker Hub Repository
**Repository:** `lavanyanallabelli/pos-system`

### Image Naming Convention
- **Frontend:** `lavanyanallabelli/pos-system-frontend`
- **Backend:** `lavanyanallabelli/pos-system-backend`

### Image Tags
1. **Versioned Tag:** `{BUILD_NUMBER}-{COMMIT_HASH}`
   - Example: `190-c5cff37`
   - Used for specific build tracking
   
2. **Latest Tag:** `latest`
   - Points to most recent successful build
   - Used for quick deployments

### Dockerfile Locations
- **Frontend:** `code/client/Dockerfile`
- **Backend:** `code/server/Dockerfile`

### Docker Build Strategy
- Builds both frontend and backend images
- Tags each image with both versioned and latest tags
- Pushes all tags to Docker Hub for registry storage

---

## 7️⃣ Deployment Process

### Deployment Architecture

```
Jenkins Pipeline
    ↓
Docker Hub (Image Registry)
    ↓
AWS EC2 Instance (54.242.45.110)
    ├── Frontend: PM2 serve on port 3000
    └── Backend: PM2 node server on port 5000
```

### EC2 Server Configuration

**Server IP:** `54.242.45.110`  
**User:** `ec2-user`  
**Deployment Directory:** `/home/ec2-user/pos_system/`

#### Directory Structure on EC2
```
/home/ec2-user/pos_system/
├── build/          # Frontend production build
│   └── (static files served by PM2)
└── server/         # Backend Node.js application
    ├── server.js
    ├── package.json
    ├── node_modules/
    └── .env        # Backend environment variables (managed on EC2)
```

### PM2 Process Management

#### Frontend Process
- **Name:** `pos-system`
- **Command:** `pm2 serve /home/ec2-user/pos_system/build 3000 --name pos-system --spa`
- **Port:** 3000
- **Mode:** SPA (Single Page Application) routing enabled

#### Backend Process
- **Name:** `pos-backend`
- **Command:** `pm2 start server.js --name pos-backend`
- **Working Directory:** `/home/ec2-user/pos_system/server`
- **Port:** 5000 (default)

### Deployment Features
- ✅ Zero-downtime deployment (PM2 restart)
- ✅ Automatic process management
- ✅ Process persistence across reboots (`pm2 save`)
- ✅ Separate frontend and backend deployments
- ✅ Environment variables preserved on EC2

---

## 8️⃣ Notifications & Monitoring

### 📧 Email Notifications

#### Success Notification
- **Recipient:** `chetanjogi042@gmail.com`
- **Subject:** `✅ Jenkins Dev Build Successful - Branch: {BRANCH}`
- **Content:**
  - Build number
  - Branch name
  - Commit hash
  - Commit author
  - Commit message
  - Build URL

#### Failure Notification
- **Recipients:** 
  - `cuteamy104@gmail.com`
  - `chetanjogi042@gmail.com`
- **Subject:** `❌ Jenkins Dev Build Failed - Branch: {BRANCH}`
- **Content:**
  - Build failure details
  - Console output link
  - Commit information

#### Health Report (Always)
- **Recipient:** `chetanjogi042@gmail.com`
- **Subject:** `🩺 Jenkins Health Report - Build #{BUILD_NUMBER} ({STATUS})`
- **Content:**
  - Build information (status, duration, timestamp, node)
  - System health (disk usage, memory usage)
  - Docker usage statistics
  - Project information (commit, author, message)

### 💬 Slack Notifications

**Credential ID:** `slack-webhook`  
**Webhook Variable:** `SLACK_URL`

#### Success Notification
- **Color:** Green (`good`)
- **Icon:** ✅ White check mark
- **Message:** `Jenkins Dev Build Succeeded!`
- **Fields:**
  - Branch
  - Build number
  - Project name
  - Commit hash
  - Author
  - Commit message

#### Failure Notification
- **Color:** Red (`danger`)
- **Icon:** ❌ Cross mark
- **Message:** `Jenkins Dev Build Failed!`
- **Fields:** Same as success notification

### 🩺 Jenkins Health Report

Generated after every build (success or failure) with:

**Build Metrics:**
- Build number and status
- Previous build result
- Build duration
- Build timestamp
- Node/agent name

**System Health:**
- Disk usage (used/total/percentage)
- Memory usage (used/total/percentage)
- Docker usage (images/containers/volumes)

**Project Information:**
- Commit details
- Author information
- Commit message

---

## 9️⃣ Jenkins Plugins Required

The following Jenkins plugins must be installed for the pipeline to function:

### Core Plugins
1. **Pipeline Plugin** (`workflow-aggregator`)
   - Enables declarative pipeline syntax
   - Core Jenkins pipeline functionality

2. **Git Plugin** (`git`)
   - GitHub repository integration
   - Branch checkout and git operations

3. **Credentials Plugin** (`credentials`)
   - Secure credential management
   - Required for Docker Hub, SSH, and Slack

### Docker Plugins
4. **Docker Pipeline Plugin** (`docker-workflow`)
   - Docker build and push operations
   - Docker container management

### Notification Plugins
5. **Email Extension Plugin** (`email-ext`)
   - Advanced email notifications
   - Email templates and formatting
   - Health report emails

6. **Slack Notification Plugin** (`slack`)
   - Slack webhook integration
   - Real-time build notifications

### Utility Plugins
7. **Workspace Cleanup Plugin** (`ws-cleanup`)
   - Automatic workspace cleanup
   - Disk space management

8. **SSH Agent Plugin** (`ssh-agent`)
   - SSH key management
   - Secure EC2 deployment

### Optional Plugins
9. **GitHub Integration Plugin** (`github`)
   - GitHub webhook support (optional)
   - GitHub status updates (optional)

10. **Build Timeout Plugin** (`build-timeout`)
    - Prevents hanging builds (recommended)

---

## 🔟 Jenkins Credentials Setup

### Required Credentials

#### 1. Docker Hub Credentials
- **Credential ID:** `dockerhub-creds`
- **Type:** Username with password
- **Username Variable:** `DOCKER_USER`
- **Password Variable:** `DOCKER_PASS`
- **Usage:** Docker Hub login and image push

**Setup:**
```
Jenkins → Manage Jenkins → Credentials → Add Credentials
Type: Username with password
Scope: Global
Username: [Your Docker Hub username]
Password: [Your Docker Hub password/token]
ID: dockerhub-creds
```

#### 2. AWS EC2 SSH Key
- **Credential ID:** `AWS_DEV_SSH_KEY`
- **Type:** SSH Username with private key
- **Username Variable:** `SSH_USER`
- **Key File Variable:** `SSH_KEY`
- **Usage:** EC2 server deployment via SSH/SCP

**Setup:**
```
Jenkins → Manage Jenkins → Credentials → Add Credentials
Type: SSH Username with private key
Scope: Global
Username: ec2-user (or your EC2 username)
Private Key: [Paste your EC2 private key]
ID: AWS_DEV_SSH_KEY
```

#### 3. Slack Webhook
- **Credential ID:** `slack-webhook`
- **Type:** Secret text
- **Variable:** `SLACK_URL`
- **Usage:** Slack notifications

**Setup:**
```
Jenkins → Manage Jenkins → Credentials → Add Credentials
Type: Secret text
Scope: Global
Secret: [Your Slack webhook URL]
ID: slack-webhook
```

**Slack Webhook URL Format:**
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 1️⃣1️⃣ Troubleshooting

### Common Issues and Solutions

#### 1. Pipeline Fails at Checkout
**Error:** `Repository not found` or `Permission denied`

**Solutions:**
- Verify GitHub repository URL is correct
- Check branch name exists (`prod`, `QA`, `main`)
- Ensure Jenkins has access to the repository (public or credentials)

---

#### 2. Docker Build Fails
**Error:** `Cannot connect to Docker daemon` or `Dockerfile not found`

**Solutions:**
- Verify Jenkins agent has Docker installed
- Check Docker daemon is running on the agent
- Verify Dockerfile exists in `code/client/` and `code/server/`
- Ensure agent label `docker-slave` is correct
- Check user permissions for Docker (`sudo` may be required)

---

#### 3. Docker Push Fails
**Error:** `unauthorized: authentication required` or `denied: requested access to the resource is denied`

**Solutions:**
- Verify `dockerhub-creds` credential exists and is correct
- Check Docker Hub username and password/token
- Ensure Docker Hub repository name matches: `lavanyanallabelli/pos-system`
- Verify Docker Hub account has push permissions

---

#### 4. SSH/SCP Connection Fails
**Error:** `Permission denied (publickey)` or `Connection timed out`

**Solutions:**
- Verify `AWS_DEV_SSH_KEY` credential is correctly configured
- Check EC2 instance IP address: `54.242.45.110`
- Ensure SSH key matches the EC2 instance key pair
- Verify EC2 security group allows SSH from Jenkins server
- Test SSH connection manually: `ssh -i key.pem ec2-user@54.242.45.110`
- Check EC2 instance is running and accessible

---

#### 5. PM2 Deployment Fails
**Error:** `pm2: command not found` or `PM2 process start failed`

**Solutions:**
- Verify PM2 is installed on EC2: `pm2 --version`
- Install PM2 if missing: `npm install -g pm2`
- Check directory permissions on EC2
- Verify backend `server.js` exists and is executable
- Check backend dependencies are installed: `npm install`
- Review PM2 logs: `pm2 logs pos-backend` or `pm2 logs pos-system`

---

#### 6. Frontend Build Fails
**Error:** `npm run build:client` fails or environment variables not set

**Solutions:**
- Verify `npm run build:client` script exists in root `package.json`
- Check environment variables are set correctly in pipeline
- Ensure `.env` file is created in `code/client/` before build
- Check React build errors in console output
- Verify all frontend dependencies are installed

---

#### 7. Slack Notifications Not Sent
**Error:** No Slack message received or HTTP error

**Solutions:**
- Verify `slack-webhook` credential exists
- Test Slack webhook URL manually with curl
- Check Slack webhook is not expired or revoked
- Verify Slack channel exists and webhook is configured
- Review build logs for HTTP response codes

---

#### 8. Email Notifications Not Sent
**Error:** No email received or SMTP error

**Solutions:**
- Configure Jenkins SMTP settings: `Manage Jenkins → Configure System → E-mail Notification`
- Verify SMTP server, port, and credentials
- Check email addresses are correct in pipeline
- Test email configuration with "Test configuration" button
- Review Jenkins logs for email errors

---

#### 9. Health Report Script Errors
**Error:** `Scripts not permitted to use staticMethod jenkins.model.Jenkins get`

**Solutions:**
- ✅ **Fixed:** Health report now uses shell commands instead of Jenkins.instance
- If errors persist, check Script Security Plugin settings
- Verify shell commands are available on Jenkins agent

---

#### 10. Workspace Cleanup Issues
**Error:** Workspace not cleaned or disk space issues

**Solutions:**
- Verify `ws-cleanup` plugin is installed
- Check `cleanWs()` is called in `always` block
- Manually clean workspace if needed: `Manage Jenkins → Workspace`
- Monitor disk space on Jenkins server/agent

---

### Debugging Tips

1. **Enable Pipeline Debugging:**
   - Add `-Dorg.jenkinsci.plugins.workflow.steps.durable-task.DurableTaskStep.USE_WATCHING=true` to Jenkins JVM arguments

2. **Check Build Console Output:**
   - Review full console output for detailed error messages
   - Look for specific stage failure points

3. **Test Individual Commands:**
   - SSH into EC2 and test commands manually
   - Test Docker commands on Jenkins agent
   - Verify GitHub access from Jenkins server

4. **Review Jenkins Logs:**
   - `Manage Jenkins → System Log`
   - `Manage Jenkins → Log Recorder`

5. **Validate Credentials:**
   - Test credentials manually where possible
   - Verify credential IDs match pipeline code

---

## 📝 Additional Notes

### Branch Workflow
- **prod:** Production deployment branch
- **QA:** Quality assurance testing branch
- **main:** Main development branch

### Docker Image Management
- Images are tagged with both versioned and latest tags
- Old images can be cleaned from Docker Hub periodically
- Versioned tags allow rollback to specific builds

### Environment Variable Management
- Frontend environment variables are baked into React build
- Backend environment variables are managed on EC2 (not in pipeline)
- Sensitive data should use Jenkins credentials, not pipeline variables

### PM2 Process Management
- PM2 processes are automatically saved and persist across reboots
- Use `pm2 list` on EC2 to check running processes
- Use `pm2 logs` to view application logs
- Use `pm2 restart <name>` for manual restart

### Security Best Practices
- ✅ SSH keys stored as Jenkins credentials (not in code)
- ✅ Docker Hub credentials secured
- ✅ Slack webhook stored as secret
- ⚠️ Environment variables in pipeline are visible (use credentials for sensitive data)
- ⚠️ EC2 IP addresses are public (ensure security groups are configured)

---

## ✅ Summary

This CI/CD pipeline provides a **production-grade automated deployment system** with:

- ✅ **Multi-branch support** (prod, QA, main)
- ✅ **Docker containerization** for consistency
- ✅ **Docker Hub integration** for image registry
- ✅ **Zero-downtime deployments** with PM2
- ✅ **Comprehensive notifications** (Slack + Email)
- ✅ **Health monitoring** and reporting
- ✅ **Automatic cleanup** and resource management
- ✅ **Secure credential management**

The pipeline automates the entire software delivery process from code commit to production deployment, ensuring consistent, reliable, and monitored deployments to the AWS EC2 development environment.

---

## 📞 Support & Resources

- **GitHub Repository:** https://github.com/lavanyanallabelli/Capstone_team4
- **Jenkins Job:** Capstone-Dev-Build
- **Docker Hub:** https://hub.docker.com/r/lavanyanallabelli/pos-system
- **EC2 Instance:** 54.242.45.110

---

**Document Version:** 1.0  
**Last Updated:** Based on Jenkinsfile pipeline configuration  
**Maintained By:** Capstone Team 4
