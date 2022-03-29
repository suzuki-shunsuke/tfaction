# https://github.com/terraform-linters/tflint-ruleset-aws
plugin "aws" {
  enabled = true
  version = "0.13.2" # renovate: depName=terraform-linters/tflint-ruleset-aws
  source  = "github.com/terraform-linters/tflint-ruleset-aws"

  # https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/deep_checking.md
  deep_check = false
}

# https://github.com/terraform-linters/tflint/tree/master/docs/rules
rule "terraform_deprecated_index" {
  enabled = true
}

rule "terraform_unused_declarations" {
  enabled = true
}

rule "terraform_comment_syntax" {
  enabled = true
}

rule "terraform_documented_outputs" {
  enabled = true
}

rule "terraform_documented_variables" {
  enabled = true
}

rule "terraform_typed_variables" {
  enabled = true
}

rule "terraform_naming_convention" {
  enabled = true
}

rule "terraform_required_version" {
  enabled = true
}

rule "terraform_required_providers" {
  enabled = true
}

rule "terraform_standard_module_structure" {
  enabled = false
}

rule "aws_elasticache_replication_group_default_parameter_group" {
  # https://github.com/terraform-linters/tflint-ruleset-aws/blob/v0.6.0/docs/rules/aws_elasticache_replication_group_default_parameter_group.md
  # This rule isn't needed.
  enabled = false
}

rule "aws_iam_policy_sid_invalid_characters" {
  # https://github.com/terraform-linters/tflint-ruleset-aws/blob/master/docs/rules/aws_iam_policy_sid_invalid_characters.md
  # This doesn't work well
  enabled = false
}
