# Policy: CloudWatch Log Group's retention in days must be set and greater than zero

[Policy](cloudwatch_log_retention_in_days.rego)

## Overview

The resource `aws_cloudwatch_log_group`'s `retention_in_days` must be set and greater than zero.

## Target resources and attributes

- [aws_cloudwatch_log_group's retention_in_days](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group#retention_in_days)

## Why is this policy needed?

If CloudWatch Log Group's retention in day's isn't set, the log is stored forever.
If the retention in days is `0`, it means the log is stored forever.
Compared to the storage like S3, CloudWatch Log is expensive.
Basically we don't check the old log.
To save cost, we should set the retention in days.

## How to fix

Set the attribute `retention_in_days` to the resource.

```tf
resource "aws_cloudwatch_log_group" "main" {
  # ...
  retention_in_days = 90
}
```
