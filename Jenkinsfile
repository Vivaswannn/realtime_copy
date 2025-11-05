pipeline {
    agent any

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
                sh 'node -v && npm -v || true'
                sh 'npm ci || npm install'
            }
        }
        stage('Build tests') {
            steps {
                sh 'echo "No tests configured"'
            }
        }
        stage('Docker Build') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .'
            }
        }
        stage('Docker Tag') {
            when { expression { return env.REGISTRY?.trim() } }
            steps {
                sh 'docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}'
                sh 'docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:latest'
            }
        }
        stage('Docker Push') {
            when { expression { return env.REGISTRY?.trim() && env.CREDENTIALS_ID?.trim() } }
            steps {
                withCredentials([usernamePassword(credentialsId: "${CREDENTIALS_ID}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo "$DOCKER_PASS" | docker login ${REGISTRY} -u "$DOCKER_USER" --password-stdin'
                    sh 'docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}'
                    sh 'docker push ${REGISTRY}/${IMAGE_NAME}:latest'
                    sh 'docker logout ${REGISTRY}'
                }
            }
        }
    }
}
