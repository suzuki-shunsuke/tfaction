import { z } from "zod";

const GitHubEnvironment = z.union([
  z.string(),
  z.object({
    name: z.string(),
    url: z.string(),
  }),
]);
export type GitHubEnvironment = z.infer<typeof GitHubEnvironment>;

export const JobType = z.union([
  z.literal("terraform"),
  z.literal("tfmigrate"),
  z.literal("scaffold_working_dir"),
]);
export type JobType = z.infer<typeof JobType>;

const ReviewdogConfig = z.object({
  filter_mode: z.enum(["added", "diff_context", "file", "nofilter"]).optional(),
  fail_level: z.enum(["none", "any", "info", "warning", "error"]).optional(),
});

const tflintDefaults = { enabled: true, fix: false } as const;
const TflintConfig = z.object({
  enabled: z.boolean().default(tflintDefaults.enabled),
  fix: z.boolean().default(tflintDefaults.fix),
  reviewdog: ReviewdogConfig.optional(),
});
export type TflintConfig = z.infer<typeof TflintConfig>;

const trivyDefaults = { enabled: true } as const;
const TrivyConfig = z.object({
  enabled: z.boolean().default(trivyDefaults.enabled),
  reviewdog: ReviewdogConfig.optional(),
});
export type TrivyConfig = z.infer<typeof TrivyConfig>;

const TerraformDocsConfig = z.object({
  enabled: z.boolean().optional(),
});
type TerraformDocsConfig = z.infer<typeof TerraformDocsConfig>;

const ConftestPolicyConfig = z.object({
  tf: z.boolean().optional(),
  plan: z.boolean().optional(),
  id: z.string().optional(),
  enabled: z.boolean().optional(),
  policy: z.union([z.string(), z.string().array()]),
  data: z.union([z.string(), z.string().array()]).optional(),
  fail_on_warn: z.boolean().optional(),
  no_fail: z.boolean().optional(),
  all_namespaces: z.boolean().optional(),
  quiet: z.boolean().optional(),
  trace: z.boolean().optional(),
  strict: z.boolean().optional(),
  show_builtin_errors: z.boolean().optional(),
  junit_hide_message: z.boolean().optional(),
  suppress_exceptions: z.boolean().optional(),
  combine: z.boolean().optional(),
  tls: z.boolean().optional(),
  ignore: z.string().optional(),
  parser: z.string().optional(),
  capabilities: z.string().optional(),
  output: z.string().optional(),
  namespaces: z.string().array().optional(),
  proto_file_dirs: z.string().array().optional(),
  paths: z.string().array().optional(),
});
export type ConftestPolicyConfig = z.infer<typeof ConftestPolicyConfig>;

const ConftestConfig = z.object({
  disable_all: z.boolean().optional(),
  policies: ConftestPolicyConfig.array().optional(),
});
type ConftestConfig = z.infer<typeof ConftestConfig>;

const GitHubSecrets = z
  .object({
    env_name: z.string(),
    secret_name: z.string(),
  })
  .array();
export type GitHubSecrets = z.infer<typeof GitHubSecrets>;

const AWSSecretsManagerSecretEnv = z.object({
  env_name: z.string(),
  secret_key: z.string().optional(),
});
type AWSSecretsManagerSecretEnv = z.infer<typeof AWSSecretsManagerSecretEnv>;

const AWSSecretsManagerSecret = z.object({
  envs: AWSSecretsManagerSecretEnv.array(),
  secret_id: z.string(),
  version_id: z.string().optional(),
  version_stage: z.string().optional(),
  aws_region: z.string().optional(),
});
export type AWSSecretsManagerSecret = z.infer<typeof AWSSecretsManagerSecret>;

const JobConfig = z.object({
  aws_assume_role_arn: z.string().optional(),
  aws_role_session_name: z.string().optional(),
  gcp_service_account: z.string().optional(),
  gcp_workload_identity_provider: z.string().optional(),
  gcp_access_token_scopes: z.string().optional(),
  gcp_remote_backend_service_account: z.string().optional(),
  gcp_remote_backend_workload_identity_provider: z.string().optional(),
  environment: GitHubEnvironment.optional(),
  secrets: GitHubSecrets.optional(),
  runs_on: z.union([z.string(), z.string().array()]).optional(),
  env: z.record(z.string(), z.string()).optional(),
  aws_secrets_manager: AWSSecretsManagerSecret.array().optional(),
});
export type JobConfig = z.infer<typeof JobConfig>;

const TargetGroup = z.object({
  aws_region: z.string().optional(),
  aws_assume_role_arn: z.string().optional(),
  aws_role_session_name: z.string().optional(),
  destroy: z.boolean().optional(),
  env: z.record(z.string(), z.string()).optional(),
  environment: GitHubEnvironment.optional(),
  gcp_service_account: z.string().optional(),
  gcp_workload_identity_provider: z.string().optional(),
  gcp_remote_backend_service_account: z.string().optional(),
  gcp_remote_backend_workload_identity_provider: z.string().optional(),
  gcs_bucket_name_tfmigrate_history: z.string().optional(),
  runs_on: z.union([z.string(), z.string().array()]).optional(),
  secrets: GitHubSecrets.optional(),
  s3_bucket_name_tfmigrate_history: z.string().optional(),
  template_dir: z.string().optional(),
  terraform_apply_config: JobConfig.optional(),
  terraform_plan_config: JobConfig.optional(),
  tfmigrate_apply_config: JobConfig.optional(),
  tfmigrate_plan_config: JobConfig.optional(),
  working_directory: z.string(),
  aws_secrets_manager: AWSSecretsManagerSecret.array().optional(),
  terraform_command: z.string().optional(),
  conftest: ConftestConfig.optional(),
  drift_detection: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
});
export type TargetGroup = z.infer<typeof TargetGroup>;

export const TargetConfig = z.object({
  aws_assume_role_arn: z.string().optional(),
  aws_region: z.string().optional(),
  destroy: z.boolean().optional(),
  drift_detection: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
  env: z.record(z.string(), z.string()).optional(),
  gcs_bucket_name_tfmigrate_history: z.string().optional(),
  gcp_service_account: z.string().optional(),
  gcp_workload_identity_provider: z.string().optional(),
  providers_lock_opts: z.string().optional(),
  s3_bucket_name_tfmigrate_history: z.string().optional(),
  secrets: GitHubSecrets.optional(),
  terraform_apply_config: JobConfig.optional(),
  terraform_plan_config: JobConfig.optional(),
  tfmigrate_apply_config: JobConfig.optional(),
  tfmigrate_plan_config: JobConfig.optional(),
  terraform_command: z.string().optional(),
  terraform_docs: TerraformDocsConfig.optional(),
  conftest: ConftestConfig.optional(),
});
export type TargetConfig = z.infer<typeof TargetConfig>;

const labelPrefixesDefaults = {
  skip: "skip:",
  tfmigrate: "tfmigrate:",
} as const;
const LabelPrefixes = z.object({
  skip: z.string().default(labelPrefixesDefaults.skip),
  tfmigrate: z.string().default(labelPrefixesDefaults.tfmigrate),
});
export type LabelPrefixes = z.infer<typeof LabelPrefixes>;

const Replace = z.object({
  patterns: z
    .object({
      regexp: z.string(),
      replace: z.string(),
      flags: z.string().optional(),
    })
    .array(),
});
export type Replace = z.infer<typeof Replace>;

export const RawConfig = z.object({
  aqua: z
    .object({
      update_checksum: z
        .object({
          enabled: z.boolean().optional(),
          skip_push: z.boolean().optional(),
          prune: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  conftest: ConftestConfig.optional(),
  draft_pr: z.boolean().default(false),
  drift_detection: z
    .object({
      issue_repo_owner: z.string().optional(),
      issue_repo_name: z.string().optional(),
      num_of_issues: z.number().optional(),
      minimum_detection_interval: z.number().default(168),
      enabled: z.boolean().optional(),
    })
    .optional(),
  env: z.record(z.string(), z.string()).optional(),
  label_prefixes: LabelPrefixes.default(labelPrefixesDefaults),
  module_file: z.string().default("tfaction_module.yaml"),
  plan_workflow_name: z.string(),
  renovate_login: z.string().default("renovate[bot]"),
  renovate_terraform_labels: z.string().array().optional(),
  scaffold_working_directory: z
    .object({
      pull_request: z
        .object({
          title: z.string().optional(),
          body: z.string().optional(),
          comment: z.string().optional(),
        })
        .nullish(),
    })
    .nullish(),
  follow_up_pr: z
    .object({
      pull_request: z
        .object({
          title: z.string().optional(),
          body: z.string().optional(),
          comment: z.string().optional(),
        })
        .nullish(),
      group_label: z
        .object({
          enabled: z.boolean().optional(),
          prefix: z.string().optional(),
        })
        .nullish(),
    })
    .nullish(),
  scaffold_module: z
    .object({
      pull_request: z
        .object({
          title: z.string().optional(),
          body: z.string().optional(),
          comment: z.string().optional(),
        })
        .nullish(),
    })
    .nullish(),
  scaffold_tfmigrate: z
    .object({
      pull_request: z
        .object({
          title: z.string().optional(),
          body: z.string().optional(),
          comment: z.string().optional(),
        })
        .nullish(),
    })
    .nullish(),
  skip_create_pr: z.boolean().default(false),
  skip_terraform_by_renovate: z.boolean().optional(),
  target_groups: TargetGroup.array(),
  tflint: TflintConfig.default(tflintDefaults),
  trivy: TrivyConfig.default(trivyDefaults),
  terraform_docs: TerraformDocsConfig.optional(),
  update_local_path_module_caller: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
  terraform_command: z.string().default("terraform"),
  update_related_pull_requests: z
    .object({
      enabled: z.boolean().optional(),
    })
    .optional(),
  working_directory_file: z.string().default("tfaction.yaml"),
  replace_target: Replace.optional(),
  providers_lock_opts: z.string().optional(),
  securefix_action: z
    .object({
      server_repository: z.string(),
      pull_request: z.object({
        base_branch: z.string(),
      }),
    })
    .optional(),
  limit_changed_dirs: z
    .object({
      working_dirs: z.number().optional(),
      modules: z.number().optional(),
    })
    .optional(),
});
export type RawConfig = z.infer<typeof RawConfig>;

// ParsedConfig is the type after zod parsing with defaults applied
type ParsedConfig = z.output<typeof RawConfig>;

// Config with default values applied and dynamic fields added
export interface Config extends ParsedConfig {
  /** Absolute path to git root directory */
  git_root_dir: string;
  config_path: string;
  config_dir: string;
  workspace: string;
}
