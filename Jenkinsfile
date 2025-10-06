pipeline {
    agent any
    
    // tools {
        // nodejs "NodeJS"
    // }

    parameters {
        choice(
            name: 'BRANCH',
            choices: ['dev', 'QA', 'prod', 'main'],
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

        stage('Build Client Application') {
            steps {
                dir('pos_system-main') {
                    bat 'npm run build:client'
                }
            }
        }

        stage('Deploy to DEV EC2') {
            when {
                expression { params.BRANCH == 'dev' }
            }
            steps {
                sshagent(credentials: ['aws-ec2-key']) {
                    bat 'ssh -o StrictHostKeyChecking=no ec2-user@YOUR_DEV_EC2_PUBLIC_IP "cd /home/ec2-user/dev_app && git pull origin %BRANCH% && npm install && pm2 restart all || pm2 start npm --name dev-app -- run start"'
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment to ${params.BRANCH} successful!"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
