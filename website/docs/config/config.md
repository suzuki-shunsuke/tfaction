---
sidebar_position: 100
---

# Configuration

## Configuration File

- [tfaction-root.yaml](tfaction-root-yaml.md)
- [tfaction.yaml](tfaction-yaml.md)

## Environment Variables

| name              | default              | description                                                               |
| ----------------- | -------------------- | ------------------------------------------------------------------------- |
| TFACTION_CONFIG   | `tfaction-root.yaml` | configuration file path                                                   |
| TFACTION_TARGET   |                      | target                                                                    |
| TFACTION_IS_APPLY |                      | `true` or `false`. Whether `terraform apply` or `tfmigrate apply` are run |
| TFACTION_JOB_TYPE |                      | `terraform` or `tfmigrate`                                                |
