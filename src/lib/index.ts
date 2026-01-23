import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import { load } from "js-yaml";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { listWorkingDirFiles } from "./git";

export const GitHubActionPath = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
);

export const GitHubCommentConfig = path.join(
  GitHubActionPath,
  "install",
  "github-comment.yaml",
);

export const aquaConfig = path.join(
  GitHubActionPath,
  "install",
  "aqua",
  "aqua.yaml",
);

const aquaGlobalConfigEnv = process.env.AQUA_GLOBAL_CONFIG ?? "";
export const aquaGlobalConfig = aquaGlobalConfigEnv
  ? `${aquaGlobalConfigEnv}:${aquaConfig}`
  : aquaConfig;

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
type TflintConfig = z.infer<typeof TflintConfig>;

const trivyDefaults = { enabled: true } as const;
const TrivyConfig = z.object({
  enabled: z.boolean().default(trivyDefaults.enabled),
  reviewdog: ReviewdogConfig.optional(),
});
type TrivyConfig = z.infer<typeof TrivyConfig>;

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

const TargetConfig = z.object({
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

const RawConfig = z.object({
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

export const generateJSONSchema = (dir: string) => {
  const configJSONSchema = z.toJSONSchema(RawConfig);
  fs.writeFileSync(
    path.join(dir, "tfaction-root.json"),
    JSON.stringify(configJSONSchema, null, 2),
  );

  const targetConfigJSONSchema = z.toJSONSchema(TargetConfig);
  fs.writeFileSync(
    path.join(dir, "tfaction.json"),
    JSON.stringify(targetConfigJSONSchema, null, 2),
  );
};

export const applyConfigDefaults = async (
  raw: z.input<typeof RawConfig>,
  configPath: string,
  workspace: string,
): Promise<Config> => {
  const parsed = RawConfig.parse(raw);
  const configDir = path.dirname(configPath);
  const gitRootDir = await getGitRootDir(configDir);
  return {
    ...parsed,
    git_root_dir: gitRootDir,
    config_path: configPath,
    config_dir: configDir,
    workspace: workspace,
  };
};

export const getConfig = async (): Promise<Config> => {
  const configPath = process.env.TFACTION_CONFIG ?? "tfaction-root.yaml";
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const raw = RawConfig.parse(load(fs.readFileSync(configPath, "utf8")));
  return await applyConfigDefaults(raw, configPath, workspace);
};

/**
 *
 * @param wds relative paths from git root directory
 * @param config
 * @returns a map of working directory to target name
 */
export const createWDTargetMap = (
  wds: string[],
  targetGroups: TargetGroup[],
  replaceTarget: Replace | undefined,
): Map<string, string> => {
  const m = new Map<string, string>();
  for (const wd of wds) {
    let target = wd;
    for (const tg of targetGroups) {
      const rel = path.relative(tg.working_directory, wd);
      // path.isAbsolute check handles Windows edge case where different drive letters result in absolute path
      if (rel.startsWith("..") || path.isAbsolute(rel)) {
        continue;
      }
      for (const pattern of replaceTarget?.patterns ?? []) {
        target = target.replace(
          new RegExp(pattern.regexp, pattern.flags),
          pattern.replace,
        );
      }
      break;
    }
    m.set(wd, target);
  }
  return m;
};

/**
 *
 * @param targetGroups
 * @param wd a relative path from tfaction-root.yaml
 * @returns
 */
export const getTargetFromTargetGroupsByWorkingDir = (
  targetGroups: Array<TargetGroup>,
  wd: string,
): TargetGroup | undefined => {
  for (const targetConfig of targetGroups) {
    const rel = path.relative(targetConfig.working_directory, wd);
    // path.isAbsolute check handles Windows edge case where different drive letters result in absolute path
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) {
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

export const setValues = (name: string, values: Array<unknown>): void => {
  for (const value of values) {
    if (value != undefined) {
      core.setOutput(name, value);
      return;
    }
  }
};

export const setOutputs = <T extends object>(
  keys: Array<string>,
  objs: Array<T | undefined>,
): Map<string, string> => {
  const outputs = new Map<string, string>();
  for (const key of keys) {
    for (const obj of objs) {
      if (obj != undefined && obj != null && key in obj) {
        const value = (obj as Record<string, unknown>)[key];
        if (value != undefined) {
          outputs.set(key, value as string);
        }
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
): Map<string, string> => {
  const envs = new Map<string, string>();
  for (const obj of objs) {
    if (obj?.env) {
      for (const [key, value] of Object.entries(obj.env)) {
        envs.set(key, value);
      }
    }
  }
  return envs;
};

export type Target = {
  target: string;
  workingDir: string;
  group?: TargetGroup;
};

/**
 *
 * @param config
 * @param target
 * @param workingDir a relative path from tfaction-root.yaml
 * @returns
 */
export const getTargetGroup = async (
  config: {
    config_path: string;
    working_directory_file: string;
    target_groups: TargetGroup[];
    replace_target?: Replace | undefined;
  },
  target?: string,
  workingDir?: string,
): Promise<Target> => {
  if (workingDir) {
    const targetConfig = getTargetFromTargetGroupsByWorkingDir(
      config.target_groups,
      workingDir,
    );
    if (target) {
      return {
        target: target,
        workingDir: workingDir,
        group: targetConfig,
      };
    }
    target = workingDir;
    for (const pattern of config.replace_target?.patterns ?? []) {
      target = target.replace(new RegExp(pattern.regexp), pattern.replace);
    }
    return {
      target: target,
      workingDir: workingDir,
      group: targetConfig,
    };
  }

  if (target === undefined) {
    throw new Error(
      "Either TFACTION_TARGET or TFACTION_WORKING_DIR is required",
    );
  }

  const configDir = path.dirname(config.config_path);
  const gitRootDir = await getGitRootDir(configDir);

  const wds: string[] = [];
  const files = await listWorkingDirFiles(
    gitRootDir,
    config.working_directory_file,
  );
  for (const file of files) {
    wds.push(path.dirname(file));
  }
  const m = createWDTargetMap(wds, config.target_groups, config.replace_target);
  for (const [wd, t] of m) {
    if (t === target) {
      workingDir = wd;
      break;
    }
  }
  if (workingDir === undefined) {
    workingDir = target;
  }
  const targetConfig = getTargetFromTargetGroupsByWorkingDir(
    config.target_groups,
    workingDir,
  );
  return {
    target: target,
    workingDir: workingDir,
    group: targetConfig,
  };
};

export type Issue = {
  url: string;
  number: number;
  state: string;
  title: string;
  target: string;
};

export const createIssue = async (
  target: string,
  ghToken: string,
  repoOwner: string,
  repoName: string,
): Promise<Issue> => {
  const octokit = github.getOctokit(ghToken);
  const body = `
  This issues was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).

  About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).
  `;

  const issue = await octokit.rest.issues.create({
    owner: repoOwner,
    repo: repoName,
    title: `Terraform Drift (${target})`,
    body: body,
  });
  return {
    url: issue.data.html_url,
    number: issue.data.number,
    title: issue.data.title,
    target: target,
    state: issue.data.state,
  };
};

export const checkDriftDetectionEnabled = (
  cfg: Config,
  targetGroup: TargetGroup | undefined,
  wdCfg: TargetConfig,
): boolean => {
  if (wdCfg.drift_detection) {
    return wdCfg.drift_detection.enabled ?? true;
  }
  if (targetGroup?.drift_detection) {
    return targetGroup.drift_detection.enabled ?? true;
  }
  return cfg.drift_detection?.enabled ?? false;
};

export interface DriftIssueRepo {
  owner: string;
  name: string;
}

export const getDriftIssueRepo = (cfg: Config): DriftIssueRepo => {
  return {
    owner: cfg.drift_detection?.issue_repo_owner ?? github.context.repo.owner,
    name: cfg.drift_detection?.issue_repo_name ?? github.context.repo.repo,
  };
};

/**
 *
 * @param cwd a relative path from github.workspace to tfaction-root.yaml
 * @returns an absolute path to the root directory of the git repository
 */
export const getGitRootDir = async (cwd: string): Promise<string> => {
  const out = await exec.getExecOutput(
    "git",
    ["rev-parse", "--show-toplevel"],
    {
      silent: true,
      cwd,
    },
  );
  return out.stdout.trim();
};
