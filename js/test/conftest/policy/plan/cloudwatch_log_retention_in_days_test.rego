package main

test_deny_aws_cloudwatch_log_grop_retention_in_days {
	not any_deny_aws_cloudwatch_log_grop_retention_in_days
}

any_deny_aws_cloudwatch_log_grop_retention_in_days {
	seeds := [
		{
			"exp": set(), "msg": "pass",
			"resource": {
				"address": "aws_cloudwatch_log_group.main", "type": "aws_cloudwatch_log_group",
				"values": {"retention_in_days": 7},
			},
		},
		{
			"exp": {"aws_cloudwatch_log_group.main: [retention_in_days should be set and greater than 0](https://github.com/suzuki-shunsuke/terraform-monorepo-github-actions/tree/main/policy/terraform/cloudwatch_log_retention_in_days.md)"}, "msg": "retention_in_days should be greater than 0",
			"resource": {
				"address": "aws_cloudwatch_log_group.main", "type": "aws_cloudwatch_log_group",
				"values": {"retention_in_days": 0},
			},
		},
		{
			"exp": {"aws_cloudwatch_log_group.main: [retention_in_days should be set and greater than 0](https://github.com/suzuki-shunsuke/terraform-monorepo-github-actions/tree/main/policy/terraform/cloudwatch_log_retention_in_days.md)"}, "msg": "retention_in_days should be set",
			"resource": {
				"address": "aws_cloudwatch_log_group.main", "type": "aws_cloudwatch_log_group",
				"values": {},
			},
		},
	]

	some i
	seed := seeds[i]

	result := deny_aws_cloudwatch_log_grop_retention_in_days with input as wrap_single_resource(seed.resource)

	result != seed.exp
	trace(sprintf("FAIL %s (%d): %s, wanted %v, got %v", ["test_deny_aws_cloudwatch_log_grop_retention_in_days", i, seed.msg, seed.exp, result]))
}
