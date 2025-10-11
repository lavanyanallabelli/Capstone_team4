pipeline {
    agent any

    // tools {
        // nodejs "NodeJS" // Your NodeJS installation name in Jenkins
    // }

    parameters {
        choice(
            name: 'BRANCH',
            choices: ['main', 'QA', 'prod'],
            description: 'Select the branch to build'
        )
    }

    stages {
        stage('Checkout from GitHub') {
            steps {
                git branch: "${params.BRANCH}", url: 'https://github.com/lavanyanallabelli/Capstone_team4.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('pos_system-main') {
                     bat 'npm run install:all'
                }
            }
        }

        stage('Build React Application') {
            steps {
                dir('pos_system-main') {
                    bat 'npm run build:client'
                }
            }
        }
        stage('Deploy to DEV EC2') {
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'AWS_DEV_SSH_KEY', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    bat '''
                        set KEY=%WORKSPACE%\\.tmp_ssh_key
                        copy "%SSH_KEY%" "%KEY%" >nul
                        icacls "%KEY%" /inheritance:r
                        icacls "%KEY%" /grant:r "SYSTEM":F
                        icacls "%KEY%" /grant:r "%USERNAME%":F
                        icacls "%KEY%" /remove "BUILTIN\\Users" "BUILTIN\\Administrators" "CREATOR OWNER" "Authenticated Users" "Everyone" "NT AUTHORITY\\Authenticated Users" >nul 2>&1
                        echo "Checking if build files exist locally..."
                        dir pos_system-main\\client\\build\\
                        echo "Creating remote directory..."
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "mkdir -p /home/ec2-user/pos_system/build"
                        echo "Copying build files..."
                        scp -v -i "%KEY%" -o StrictHostKeyChecking=no -r pos_system-main\\client\\build\\* %SSH_USER%@50.17.73.133:/home/ec2-user/pos_system/build/
                        echo "Verifying files were copied..."
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "cd /home/ec2-user/pos_system && ls -la build/"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "pm2 stop pos-system || true"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "cd /home/ec2-user/pos_system && pm2 serve build 3000 --name pos-system --spa"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "pm2 save"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "pm2 startup -u ec2-user --hp /home/ec2-user"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "pm2 list"
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no -T %SSH_USER%@34.229.14.13 "timeout 10 pm2 logs pos-system --lines 20 || echo 'Logs command completed'"
                        del /f /q "%KEY%" >nul 2>&1
                    '''
                }
            }
        }
    }

    post {
        failure {
            echo "Build failed!"
        }
        success {
            echo "React app build completed successfully for branch ${params.BRANCH}!"
        }
    }
}