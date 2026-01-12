terraform {
  required_version = ">= 1.0"
}

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 4.0"
    }
  }
}

provider "github" {
  owner = "suzuki-shunsuke"
}
