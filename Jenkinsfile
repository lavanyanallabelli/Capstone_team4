pipeline {
    agent any

  //  tools {
   //     nodejs "NodeJS" // Your NodeJS installation name in Jenkins
  //  }

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
                    bat 'npm install'
                }
            }
        }

        stage('Build React Application') {
            steps {
                dir('pos_system-main') {
                    bat 'npm run build'
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
