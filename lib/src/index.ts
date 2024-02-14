import * as fs from "fs";
import * as core from "@actions/core";
import { load } from "js-yaml";
import { z } from "zod";

const GitHubEnvironment = z.union([
  z.string(),
  z.object({
    name: z.string(),
    url: z.string(),
  }),
]);

export type GitHubEnvironment = z.infer<typeof GitHubEnvironment>;

const JobType = z.union([
  z.literal("terraform"),
  z.literal("tfmigrate"),
  z.literal("scaffold_working_dir"),
]);

export type JobType = z.infer<typeof JobType>;

export const getJobType = (): JobType => {
  if (process.env.TFACTION_JOB_TYPE === undefined) {
    throw new Error("environment variable TFACTION_JOB_TYPE is required");
  }
  return JobType.parse(process.env.TFACTION_JOB_TYPE);
};

const TfsecConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TfsecConfig = z.infer<typeof TfsecConfig>;

const TflintConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TflintConfig = z.infer<typeof TflintConfig>;

const TrivyConfig = z.object({
  enabled: z.optional(z.boolean()),
});

export type TrivyConfig = z.infer<typeof TrivyConfig>;

const GitHubSecrets = z.array(
  z.object({
    env_name: z.string(),
    secret_name: z.string(),
  }),
);

export type GitHubSecrets = z.infer<typeof GitHubSecrets>;

const AWSSecretsManagerSecretEnv = z.object({
  env_name: z.string(),
  secret_key: z.optional(z.string()),
});

export type AWSSecretsManagerSecretEnv = z.infer<
  typeof AWSSecretsManagerSecretEnv
>;

const AWSSecretsManagerSecret = z.object({
  envs: z.array(AWSSecretsManagerSecretEnv),
  secret_id: z.string(),
  version_id: z.optional(z.string()),
  version_stage: z.optional(z.string()),
  aws_region: z.optional(z.string()),
});

export type AWSSecretsManagerSecret = z.infer<typeof AWSSecretsManagerSecret>;

const JobConfig = z.object({
  aws_assume_role_arn: z.optional(z.string()),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  environment: z.optional(GitHubEnvironment),
  secrets: z.optional(GitHubSecrets),
  runs_on: z.optional(z.string()),
  env: z.optional(z.record(z.string())),
  aws_secrets_manager: z.optional(z.array(AWSSecretsManagerSecret)),
});

export type JobConfig = z.infer<typeof JobConfig>;

const TargetGroup = z.object({
  aws_region: z.optional(z.string()),
  aws_assume_role_arn: z.optional(z.string()),
  destroy: z.optional(z.boolean()),
  env: z.optional(z.record(z.string())),
  environment: z.optional(GitHubEnvironment),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  gcs_bucket_name_tfmigrate_history: z.optional(z.string()),
  runs_on: z.optional(z.string()),
  secrets: z.optional(GitHubSecrets),
  s3_bucket_name_tfmigrate_history: z.optional(z.string()),
  target: z.string(),
  template_dir: z.optional(z.string()),
  terraform_apply_config: z.optional(JobConfig),
  terraform_plan_config: z.optional(JobConfig),
  tfmigrate_apply_config: z.optional(JobConfig),
  tfmigrate_plan_config: z.optional(JobConfig),
  working_directory: z.string(),
  aws_secrets_manager: z.optional(z.array(AWSSecretsManagerSecret)),
});

export type TargetGroup = z.infer<typeof TargetGroup>;

const TargetConfig = z.object({
  aws_assume_role_arn: z.optional(z.string()),
  aws_region: z.optional(z.string()),
  destroy: z.optional(z.boolean()),
  drift_detection: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  env: z.optional(z.record(z.string())),
  gcs_bucket_name_tfmigrate_history: z.optional(z.string()),
  gcp_service_account: z.optional(z.string()),
  gcp_workload_identity_provider: z.optional(z.string()),
  providers_lock_opts: z.optional(z.string()),
  s3_bucket_name_tfmigrate_history: z.optional(z.string()),
  secrets: z.optional(GitHubSecrets),
  terraform_apply_config: z.optional(JobConfig),
  terraform_plan_config: z.optional(JobConfig),
  tfmigrate_apply_config: z.optional(JobConfig),
  tfmigrate_plan_config: z.optional(JobConfig),
});

export type TargetConfig = z.infer<typeof TargetConfig>;

const Config = z.object({
  aqua: z.optional(
    z.object({
      update_checksum: z.optional(
        z.object({
          enabled: z.optional(z.boolean()),
          skip_push: z.optional(z.boolean()),
          prune: z.optional(z.boolean()),
        }),
      ),
    }),
  ),
  base_working_directory: z.optional(z.string()),
  conftest_policy_directory: z.optional(z.string()),
  draft_pr: z.optional(z.boolean()),
  drift_detection: z.optional(
    z.object({
      issue_repo_owner: z.optional(z.string()),
      issue_repo_name: z.optional(z.string()),
      num_of_issues: z.optional(z.number()),
      minimum_detection_interval: z.optional(z.number()),
    }),
  ),
  env: z.optional(z.record(z.string())),
  label_prefixes: z.optional(
    z.object({
      target: z.optional(z.string()),
      tfmigrate: z.optional(z.string()),
      skip: z.optional(z.string()),
    }),
  ),
  module_base_directory: z.optional(z.string()),
  module_file: z.optional(z.string()),
  plan_workflow_name: z.string(),
  renovate_login: z.optional(z.string()),
  renovate_terraform_labels: z.optional(z.array(z.string())),
  scaffold_working_directory: z.optional(
    z.object({
      skip_adding_aqua_packages: z.optional(z.boolean()),
    }),
  ),
  skip_create_pr: z.optional(z.boolean()),
  skip_terraform_by_renovate: z.optional(z.boolean()),
  target_groups: z.array(TargetGroup),
  tflint: z.optional(TflintConfig),
  tfsec: z.optional(TfsecConfig),
  trivy: z.optional(TrivyConfig),
  update_local_path_module_caller: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  update_related_pull_requests: z.optional(
    z.object({
      enabled: z.optional(z.boolean()),
    }),
  ),
  working_directory_file: z.optional(z.string()),
});

export type Config = z.infer<typeof Config>;

export const getConfig = (): Config => {
  let configFilePath = process.env.TFACTION_CONFIG;
  if (!configFilePath) {
    configFilePath = "tfaction-root.yaml";
  }
  return Config.parse(load(fs.readFileSync(configFilePath, "utf8")));
};

export const getTarget = (): string => {
  const target = process.env.TFACTION_TARGET;
  if (target) {
    return target;
  }
  throw new Error("the environment variable TFACTION_TARGET is required");
};

export const getIsApply = (): boolean => {
  return process.env.TFACTION_IS_APPLY === "true";
};

export const getTargetFromTargetGroups = (
  targetGroups: Array<TargetGroup>,
  target: string,
): TargetGroup | undefined => {
  for (let i = 0; i < targetGroups.length; i++) {
    const targetConfig = targetGroups[i];
    if (target.startsWith(targetConfig.target)) {
      return targetConfig;
    }
  }
  return undefined;
};

export const getTargetFromTargetGroupsByWorkingDir = (
  targetGroups: Array<TargetGroup>,
  wd: string,
): TargetGroup | undefined => {
  for (let i = 0; i < targetGroups.length; i++) {
    const targetConfig = targetGroups[i];
    if (wd.startsWith(targetConfig.working_directory)) {
      return targetConfig;
    }
  }
  return undefined;
};

export const readTargetConfig = (p: string): TargetConfig => {
  return TargetConfig.parse(load(fs.readFileSync(p, "utf8")));
};

export const getJobConfig = (
  config: TargetConfig | undefined,
  isApply: boolean,
  jobType: JobType,
): JobConfig | undefined => {
  if (config == undefined) {
    return undefined;
  }
  if (isApply) {
    switch (jobType) {
      case "terraform":
        return config.terraform_apply_config;
      case "tfmigrate":
        return config.tfmigrate_apply_config;
    }
  }
  switch (jobType) {
    case "terraform":
      return config.terraform_plan_config;
    case "tfmigrate":
      return config.tfmigrate_plan_config;
  }
};

export const setValues = (name: string, values: Array<any>): void => {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
};

export const setOutputs = (
  keys: Array<string>,
  objs: Array<any>,
): Map<string, any> => {
  const outputs = new Map<string, any>();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    for (const obj of objs) {
      if (obj != undefined && obj != null && obj[key] != undefined) {
        outputs.set(key, obj[key]);
        break;
      }
    }
  }
  return outputs;
};

type HasEnv = {
  env?: Record<string, string>;
};

export const setEnvs = (
  ...objs: Array<HasEnv | undefined>
): Map<string, any> => {
  const envs = new Map<string, any>();
  for (const obj of objs) {
    if (obj?.env) {
      for (const [key, value] of Object.entries(obj.env)) {
        envs.set(key, value);
      }
    }
  }
  return envs;
};

export function getTargetGroup(
  targets: Array<TargetGroup>,
  target: string,
): TargetGroup {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (target.startsWith(t.target)) {
      return t;
    }
  }
  throw new Error("target is invalid");
}
