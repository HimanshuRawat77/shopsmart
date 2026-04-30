# ShopSmart

A full-stack web application with a React frontend and Node.js/Express backend.

## Tech Stack

- **Frontend**: React 18 + Vite + ESLint
- **Backend**: Node.js + Express + ESLint
- **Testing**: Vitest (frontend), Jest + Supertest (backend), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Database**: SQLite + Prisma (ORM)

## Getting Started

```bash
# One-command idempotent setup
bash setup.sh

# Start backend
cd server && npm run dev

# Start frontend (in another terminal)
cd client && npm run dev
```

## Running Tests

```bash
# Backend — unit + integration tests
cd server && npm test

# Backend — linting
cd server && npm run lint

# Frontend — unit + integration tests
cd client && npm run test -- --run

# Frontend — linting
cd client && npm run lint

# E2E — Playwright (requires built frontend)
cd client && npm run build
npm run test:e2e
```

## Phase 1: Testing Reports

Phase 1 requires unit and integration tests plus generated test reports.

### Frontend Vitest Report

Run from the project root:

```bash
cd client
mkdir -p test-results
npm run test -- --run --reporter=default --reporter=junit --outputFile=./test-results/vitest-junit.xml
```

Generated report:

```text
client/test-results/vitest-junit.xml
```

### Backend Jest Report

Run from the project root:

```bash
cd server
mkdir -p test-results
npm test -- --json --outputFile=./test-results/jest-results.json
```

Generated report:

```text
server/test-results/jest-results.json
```

### GitHub Actions Artifacts

The Phase 1 workflows upload these reports automatically:

- `Frontend-test.yml` uploads `frontend-vitest-report`
- `backend-tests.yml` uploads `backend-jest-report`
- `e2e-tests.yml` already uploads `playwright-report`

## CI Workflows

| Workflow            | Trigger      | What it does                    |
| ------------------- | ------------ | ------------------------------- |
| `Frontend-test.yml` | push / PR    | lint + test + upload Vitest report + build frontend |
| `backend-tests.yml` | push / PR    | lint + test backend + upload Jest report |
| `e2e-tests.yml`     | push / PR    | build frontend + run Playwright |
| `deploy to Ec2.yml` | push to demo | deploy to AWS EC2 via SSH       |
| `deploy-pages.yml`  | push to main | deploy frontend to GitHub Pages |

## Terraform Deployment

This project includes Terraform configuration in `terraform/` for AWS ECR, ECS Fargate, IAM, security group, default VPC networking, and an encrypted private S3 bucket.

For AWS Academy, IAM role creation is restricted. This project uses the existing AWS Academy `LabRole` in Terraform instead of creating a new ECS task execution role.

### Prerequisites

Install and configure these tools before running Terraform:

- Terraform CLI
- AWS CLI
- Docker
- AWS Academy lab access with the existing `LabRole`
- Permissions for ECR, ECS, EC2 networking, S3, and CloudWatch Logs

Configure AWS credentials:

```bash
aws configure
```

Confirm your AWS identity:

```bash
aws sts get-caller-identity
```

### Step 1: Review Terraform Variables

The default values are defined in `terraform/variables.tf`:

- `aws_region`: `us-east-1`
- `project_name`: `shopsmart`
- `image_tag`: `latest`

You can override them when running Terraform:

```bash
terraform plan -var="aws_region=us-east-1" -var="image_tag=latest"
```

### Step 2: Initialize Terraform

```bash
cd terraform
terraform init
```

### Step 3: Format and Validate

```bash
terraform fmt
terraform validate
```

### Step 4: Create the ECR Repository First

The ECS task uses an image from ECR, so create the ECR repository before building and pushing the Docker image:

```bash
terraform apply -target=aws_ecr_repository.app
```

When prompted, type:

```text
yes
```

Get the ECR repository URL:

```bash
terraform output ecr_repository_url
```

### Step 5: Build and Push the Docker Image

Go back to the project root:

```bash
cd ..
```

Set variables for your AWS account and region:

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/shopsmart-repo"
IMAGE_TAG=latest
```

Log in to ECR:

```bash
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPOSITORY"
```

Build, tag, and push the image:

```bash
docker build -t shopsmart:$IMAGE_TAG .
docker tag shopsmart:$IMAGE_TAG "$ECR_REPOSITORY:$IMAGE_TAG"
docker push "$ECR_REPOSITORY:$IMAGE_TAG"
```

### Step 6: Plan the Full Infrastructure

```bash
cd terraform
terraform plan
```

Review the resources Terraform will create.

### Step 7: Apply the Full Infrastructure

```bash
terraform apply
```

When prompted, type:

```text
yes
```

### Step 8: View Outputs

```bash
terraform output
```

The important outputs are:

- `ecr_repository_url`
- `s3_bucket_name`

### Step 9: Check ECS Deployment

Use the AWS Console or AWS CLI to confirm the ECS service is running:

```bash
aws ecs list-clusters --region us-east-1
aws ecs list-services --cluster shopsmart-cluster --region us-east-1
aws ecs describe-services --cluster shopsmart-cluster --services shopsmart-service --region us-east-1
```

### Step 10: Update the Application Image

After making code changes, rebuild and push the Docker image:

```bash
docker build -t shopsmart:latest .
docker tag shopsmart:latest "$ECR_REPOSITORY:latest"
docker push "$ECR_REPOSITORY:latest"
```

Then force ECS to redeploy:

```bash
aws ecs update-service \
  --cluster shopsmart-cluster \
  --service shopsmart-service \
  --force-new-deployment \
  --region us-east-1
```

### Step 11: Destroy Infrastructure

When you no longer need the AWS resources, destroy them to avoid charges:

```bash
cd terraform
terraform destroy
```

When prompted, type:

```text
yes
```

## Phase 3: Container Build and ECS Deployment

Phase 3 requires building a Docker image, pushing it to ECR, deploying it to ECS Fargate, and verifying that the service is running.

The Dockerfile includes the required Phase 3 items:

- multi-stage build
- non-root user
- healthcheck

### Step 1: Confirm AWS Academy Access

Start your AWS Academy lab first, then configure AWS CLI credentials from the lab environment:

```bash
aws configure
```

Confirm the account:

```bash
aws sts get-caller-identity
```

### Step 2: Create or Confirm the ECR Repository

From the Terraform folder:

```bash
cd /Users/himanshurawat/shopsmart/terraform
terraform init
terraform validate
terraform apply -target=aws_ecr_repository.app
```

When prompted, type:

```text
yes
```

Get the ECR repository URL:

```bash
terraform output ecr_repository_url
```

### Step 3: Build the Docker Image

From the project root:

```bash
cd /Users/himanshurawat/shopsmart
docker build -t shopsmart:latest .
```

### Step 4: Log In to Amazon ECR

Set your AWS values:

```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/shopsmart-repo"
```

Log in:

```bash
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REPOSITORY"
```

### Step 5: Tag and Push the Image to ECR

```bash
docker tag shopsmart:latest "$ECR_REPOSITORY:latest"
docker push "$ECR_REPOSITORY:latest"
```

### Step 6: Deploy ECS Fargate with Terraform

The Terraform ECS task definition uses the AWS Academy `LabRole`, so it does not create a new IAM role.

From the Terraform folder:

```bash
cd /Users/himanshurawat/shopsmart/terraform
terraform plan
terraform apply
```

When prompted, type:

```text
yes
```

### Step 7: Verify the ECS Service

Check the ECS service:

```bash
aws ecs describe-services \
  --cluster shopsmart-cluster \
  --services shopsmart-service \
  --region us-east-1
```

Look for:

```text
status: ACTIVE
desiredCount: 1
runningCount: 1
```

List running tasks:

```bash
aws ecs list-tasks \
  --cluster shopsmart-cluster \
  --service-name shopsmart-service \
  --region us-east-1
```

Describe a task if needed:

```bash
aws ecs describe-tasks \
  --cluster shopsmart-cluster \
  --tasks TASK_ARN_HERE \
  --region us-east-1
```

Phase 3 is complete when the Docker image is in ECR and the ECS service shows `runningCount: 1`.

## Automated GitHub Pipeline

The `ShopSmart Pipeline` workflow runs automatically on every push to `main`.

Pipeline order:

```text
Push to main
Run frontend tests and upload Vitest report
Run backend tests and upload Jest report
Run Playwright E2E tests and upload Playwright report
Terraform init, validate, plan, and apply prerequisites
Build Docker image
Push Docker image to ECR
Deploy ECS Fargate service
Verify ECS service is stable
```

### Required GitHub Secrets

Add these secrets in GitHub:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_SESSION_TOKEN
TERRAFORM_STATE_BUCKET
```

For AWS Academy, `AWS_SESSION_TOKEN` is required because lab credentials are temporary.

Set `TERRAFORM_STATE_BUCKET` to:

```text
shopsmart-bucket-659fc6e3
```

### Add GitHub Secrets

In GitHub:

```text
Repository
Settings
Secrets and variables
Actions
New repository secret
```

Create each secret one by one:

```text
Name: AWS_ACCESS_KEY_ID
Value: your AWS Academy access key

Name: AWS_SECRET_ACCESS_KEY
Value: your AWS Academy secret key

Name: AWS_SESSION_TOKEN
Value: your AWS Academy session token

Name: TERRAFORM_STATE_BUCKET
Value: shopsmart-bucket-659fc6e3
```

After secrets are added, push to `main`:

```bash
git add Dockerfile README.md .gitignore .github/workflows/deploy.yml terraform/main.tf
git commit -m "Add automated AWS pipeline"
git push origin main
```

Then open GitHub:

```text
Actions
ShopSmart Pipeline
Latest workflow run
```

The test reports are available under the workflow run artifacts:

```text
frontend-vitest-report
backend-jest-report
playwright-report
```

## Project Structure

```
shopsmart/
├── client/          # React + Vite frontend
├── server/          # Node.js + Express backend
├── e2e/             # Playwright E2E tests
├── .github/
│   ├── workflows/   # CI/CD pipelines
│   └── dependabot.yml
├── setup.sh         # idempotent local setup
├── terraform/       # AWS infrastructure as code
└── playwright.config.js
```
