package main

import rego.v1

allow_aws_cloudwatch_log_group_retention_in_days(values) if {
	values.retention_in_days > 0
}

deny_aws_cloudwatch_log_group_retention_in_days contains msg if {
	walk(input.planned_values.root_module, [path, value])
	value.type == "aws_cloudwatch_log_group"
	not allow_aws_cloudwatch_log_group_retention_in_days(value.values)
	msg = sprintf("%s: [retention_in_days should be set and greater than 0](%s)", [value.address, "https://github.com/suzuki-shunsuke/terraform-monorepo-github-actions/tree/main/policy/terraform/cloudwatch_log_retention_in_days.md"])
}
