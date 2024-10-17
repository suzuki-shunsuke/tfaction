import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as lib from "lib";
import * as path from "path";

type Inputs = {
  target?: string;
  workingDir?: string;
  isApply: boolean;
  jobType: lib.JobType;
};

export type Result = {
  envs: Map<string, any>;
  outputs: Map<string, any>;
};

export const main = async () => {
  const cfg = lib.getConfig();
  if (!cfg.drift_detection) {
    // dirft detection is disabled
    return
  }

  const ghToken = process.env.GITHUB_TOKEN;
  if (!ghToken) {
    throw new Error("GITHUB_TOKEN is required");
  }
  const octokit = github.getOctokit(ghToken);

  const repoOwner = cfg.drift_detection.issue_repo_owner ??
    (process.env.GITHUB_REPOSITORY ?? "").split("/")[0];
  const repoName = cfg.drift_detection.issue_repo_name ??
    (process.env.GITHUB_REPOSITORY ?? "").split("/")[1];
  if (!repoOwner || !repoName) {
    throw new Error("repo_owner and repo_name are required");
  }
  let target = process.env.TFACTION_TARGET;
  let wd = process.env.TFACTION_WORKING_DIR;
  const tg = await lib.getTargetGroup(cfg, target, wd);
  const workingDirectoryFile = cfg.working_directory_file ?? "tfaction.yaml";

  const wdConfig = lib.readTargetConfig(
    path.join(tg.workingDir, workingDirectoryFile),
  );

  if (!checkEnabled(cfg, tg.group, wdConfig)) {
    return;
  }

  /*
  var q struct {
    Search struct {
      Nodes []struct {
        Issue struct {
          Number githubv4.Int
          Title  githubv4.String
          State  githubv4.String
        } `graphql:"... on Issue"`
      }
      PageInfo struct {
        EndCursor   githubv4.String
        HasNextPage bool
      }
    } `graphql:"search(first: 100, after: $issuesCursor, query: $searchQuery, type: $searchType)"`
  }
  variables := map[string]interface{}{
    "searchQuery":  githubv4.String(fmt.Sprintf(`repo:%s/%s "%s" in:title`, repoOwner, repoName, title)),
    "searchType":   githubv4.SearchTypeIssue,
    "issuesCursor": (*githubv4.String)(nil), // Null after argument to get first page.
  }
  */

  const { repository } = await octokit.graphql(
    `
      {
        repository(owner: "octokit", name: "graphql.js") {
          issues(last: 3) {
            edges {
              node {
                title
              }
            }
          }
        }
      }
    `,
    {
      headers: {
        authorization: `token secret123`,
      },
    },
  );
};

const checkEnabled = (cfg: lib.Config, targetGroup: lib.TargetGroup, wdCfg: lib.TargetConfig): boolean => {
  if (wdCfg.drift_detection) {
    return wdCfg.drift_detection.enabled ?? true;
  }
  if (targetGroup.drift_detection) {
    return targetGroup.drift_detection.enabled ?? true;
  }
  return cfg.drift_detection?.enabled ?? false;
};


export const run = async (
  inputs: Inputs,
  config: lib.Config,
): Promise<Result> => {
  const workingDirectoryFile = config.working_directory_file ?? "tfaction.yaml";

  const envs = new Map<string, any>();
  const outputs = new Map<string, any>();

  const t = await lib.getTargetGroup(config, inputs.target, inputs.workingDir);
  const workingDir = t.workingDir;
  const target = t.target;
  const targetConfig = t.group;

  envs.set("TFACTION_WORKING_DIR", workingDir);
  envs.set("TFACTION_TARGET", target);
  outputs.set("working_directory", workingDir);
  outputs.set(
    "providers_lock_opts",
    "-platform=windows_amd64 -platform=linux_amd64 -platform=darwin_amd64",
  );
  for (const [key, value] of lib.setOutputs(["template_dir"], [targetConfig])) {
    outputs.set(key, value);
  }

  outputs.set("enable_tfsec", config?.tfsec?.enabled ?? false);
  outputs.set("enable_tflint", config?.tflint?.enabled ?? true);
  outputs.set("enable_trivy", config?.trivy?.enabled ?? true);

  outputs.set("terraform_command", "terraform");

  if (inputs.jobType === "scaffold_working_dir") {
    const m = lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
        "gcp_access_token_scopes",
        "gcp_remote_backend_service_account",
        "gcp_remote_backend_workload_identity_provider",
      ],
      [targetConfig],
    );
    for (const [key, value] of m) {
      outputs.set(key, value);
    }
  } else {
    const rootJobConfig = lib.getJobConfig(
      targetConfig,
      inputs.isApply,
      inputs.jobType,
    );

    const wdConfig = lib.readTargetConfig(
      path.join(workingDir, workingDirectoryFile),
    );
    const jobConfig = lib.getJobConfig(
      wdConfig,
      inputs.isApply,
      inputs.jobType,
    );

    const m1 = lib.setOutputs(
      [
        "s3_bucket_name_tfmigrate_history",
        "gcs_bucket_name_tfmigrate_history",
        "providers_lock_opts",
        "terraform_command",
      ],
      [wdConfig, targetConfig, config],
    );
    for (const [key, value] of m1) {
      outputs.set(key, value);
    }

    const m2 = lib.setOutputs(
      [
        "aws_region",
        "aws_assume_role_arn",
        "gcp_service_account",
        "gcp_workload_identity_provider",
        "gcp_access_token_scopes",
        "gcp_remote_backend_service_account",
        "gcp_remote_backend_workload_identity_provider",
      ],
      [jobConfig, wdConfig, rootJobConfig, targetConfig, config],
    );
    for (const [key, value] of m2) {
      outputs.set(key, value);
    }

    outputs.set("destroy", wdConfig.destroy ? true : false);

    outputs.set(
      "enable_terraform_docs",
      wdConfig?.terraform_docs?.enabled ??
      config?.terraform_docs?.enabled ??
      false,
    );

    const m3 = lib.setEnvs(
      config,
      targetConfig,
      rootJobConfig,
      wdConfig,
      jobConfig,
    );
    for (const [key, value] of m3) {
      envs.set(key, value);
    }
  }

  return {
    outputs: outputs,
    envs: envs,
  };
};
