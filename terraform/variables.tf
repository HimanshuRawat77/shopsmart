variable "aws_region" {
  description = "The AWS region to deploy resources in"
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  default     = "shopsmart"
}

variable "image_tag" {
  description = "The tag of the Docker image to deploy"
  default     = "latest"
}
