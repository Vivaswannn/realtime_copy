pipeline {
    agent any

    tools {
        nodejs 'Node23'   
    }

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        IMAGE_NAME = 'realtime-tracker'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
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
    }
}
