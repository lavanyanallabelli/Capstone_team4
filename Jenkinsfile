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
                sshagent(credentials: ['AWS_DEV_SSH_KEY']) {    
                    sh '''
                        scp -r pos_system-main/client/build/* ec2-user@34.229.14.13:/home/ec2-user/pos_system/build/
                        ssh ec2-user@34.229.14.13 '
                            cd /home/ec2-user/pos_system
                            pm2 stop pos-system || true
                            pm2 serve build 3000 --name pos-system --spa
                        '
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