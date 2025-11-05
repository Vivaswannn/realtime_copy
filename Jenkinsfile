pipeline {
    agent any

    tools {
        nodejs 'Node23'   // 👈 this name must match what you configure in Jenkins Global Tool Configuration
    }

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        IMAGE_NAME = 'realtime-tracker'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        REGISTRY = "${env.DOCKER_REGISTRY ?: ''}"
        CREDENTIALS_ID = "${env.DOCKER_CREDENTIALS_ID ?: ''}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                bat 'node -v && npm -v'
                bat 'npm ci || npm install'
            }
        }

        stage('Build tests') {
            steps {
                bat 'echo "No tests configured"'
            }
        }

        stage('Docker Build') {
            steps {
                bat 'docker build -t %IMAGE_NAME%:%IMAGE_TAG% .'
            }
        }

        stage('Docker Tag') {
            when { expression { return env.REGISTRY?.trim() } }
            steps {
                bat 'docker tag %IMAGE_NAME%:%IMAGE_TAG% %REGISTRY%/%IMAGE_NAME%:%IMAGE_TAG%'
                bat 'docker tag %IMAGE_NAME%:%IMAGE_TAG% %REGISTRY%/%IMAGE_NAME%:latest'
            }
        }

        stage('Docker Push') {
            when { expression { return env.REGISTRY?.trim() && env.CREDENTIALS_ID?.trim() } }
            steps {
                withCredentials([usernamePassword(credentialsId: "${CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    bat 'echo %DOCKER_PASS% | docker login %REGISTRY% -u %DOCKER_USER% --password-stdin'
                    bat 'docker push %REGISTRY%/%IMAGE_NAME%:%IMAGE_TAG%'
                    bat 'docker push %REGISTRY%/%IMAGE_NAME%:latest'
                    bat 'docker logout %REGISTRY%'
                }
            }
        }
    }
}
