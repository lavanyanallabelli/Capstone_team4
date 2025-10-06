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
                        icacls "%KEY%" /grant:r %USERNAME%:R
                        
                        scp -i "%KEY%" -o StrictHostKeyChecking=no -r pos_system-main\\client\\build\\* %SSH_USER%@34.229.14.13:/home/ec2-user/pos_system/build/
                        ssh -i "%KEY%" -o StrictHostKeyChecking=no %SSH_USER%@34.229.14.13 "cd /home/ec2-user/pos_system && pm2 stop pos-system || true && pm2 serve build 3000 --name pos-system --spa"
                        
                        del /f /q "%KEY%"
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