"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTargetGroup = exports.setEnvs = exports.setOutputs = exports.setValues = exports.getJobConfig = exports.readTargetConfig = exports.getTargetFromTargetGroupsByWorkingDir = exports.getTargetFromTargetGroups = exports.getIsApply = exports.getTarget = exports.getConfig = exports.getJobType = void 0;
const fs = __importStar(require("fs"));
const core = __importStar(require("@actions/core"));
const js_yaml_1 = require("js-yaml");
const zod_1 = require("zod");
const GitHubEnvironment = zod_1.z.union([
    zod_1.z.string(),
    zod_1.z.object({
        name: zod_1.z.string(),
        url: zod_1.z.string(),
    }),
]);
const JobType = zod_1.z.union([
    zod_1.z.literal("terraform"),
    zod_1.z.literal("tfmigrate"),
    zod_1.z.literal("scaffold_working_dir"),
]);
const getJobType = () => {
    if (process.env.TFACTION_JOB_TYPE === undefined) {
        throw new Error("environment variable TFACTION_JOB_TYPE is required");
    }
    return JobType.parse(process.env.TFACTION_JOB_TYPE);
};
exports.getJobType = getJobType;
const TfsecConfig = zod_1.z.object({
    enabled: zod_1.z.optional(zod_1.z.boolean()),
});
const TflintConfig = zod_1.z.object({
    enabled: zod_1.z.optional(zod_1.z.boolean()),
});
const TrivyConfig = zod_1.z.object({
    enabled: zod_1.z.optional(zod_1.z.boolean()),
});
const GitHubSecrets = zod_1.z.array(zod_1.z.object({
    env_name: zod_1.z.string(),
    secret_name: zod_1.z.string(),
}));
const AWSSecretsManagerSecretEnv = zod_1.z.object({
    env_name: zod_1.z.string(),
    secret_key: zod_1.z.optional(zod_1.z.string()),
});
const AWSSecretsManagerSecret = zod_1.z.object({
    envs: zod_1.z.array(AWSSecretsManagerSecretEnv),
    secret_id: zod_1.z.string(),
    version_id: zod_1.z.optional(zod_1.z.string()),
    version_stage: zod_1.z.optional(zod_1.z.string()),
    aws_region: zod_1.z.optional(zod_1.z.string()),
});
const JobConfig = zod_1.z.object({
    aws_assume_role_arn: zod_1.z.optional(zod_1.z.string()),
    gcp_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    environment: zod_1.z.optional(GitHubEnvironment),
    secrets: zod_1.z.optional(GitHubSecrets),
    runs_on: zod_1.z.optional(zod_1.z.string()),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    aws_secrets_manager: zod_1.z.optional(zod_1.z.array(AWSSecretsManagerSecret)),
});
const TargetGroup = zod_1.z.object({
    aws_region: zod_1.z.optional(zod_1.z.string()),
    aws_assume_role_arn: zod_1.z.optional(zod_1.z.string()),
    destroy: zod_1.z.optional(zod_1.z.boolean()),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    environment: zod_1.z.optional(GitHubEnvironment),
    gcp_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    gcs_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    runs_on: zod_1.z.optional(zod_1.z.string()),
    secrets: zod_1.z.optional(GitHubSecrets),
    s3_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    target: zod_1.z.string(),
    template_dir: zod_1.z.optional(zod_1.z.string()),
    terraform_apply_config: zod_1.z.optional(JobConfig),
    terraform_plan_config: zod_1.z.optional(JobConfig),
    tfmigrate_apply_config: zod_1.z.optional(JobConfig),
    tfmigrate_plan_config: zod_1.z.optional(JobConfig),
    working_directory: zod_1.z.string(),
    aws_secrets_manager: zod_1.z.optional(zod_1.z.array(AWSSecretsManagerSecret)),
});
const TargetConfig = zod_1.z.object({
    aws_assume_role_arn: zod_1.z.optional(zod_1.z.string()),
    aws_region: zod_1.z.optional(zod_1.z.string()),
    destroy: zod_1.z.optional(zod_1.z.boolean()),
    drift_detection: zod_1.z.optional(zod_1.z.object({
        enabled: zod_1.z.optional(zod_1.z.boolean()),
    })),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    gcs_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    gcp_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    providers_lock_opts: zod_1.z.optional(zod_1.z.string()),
    s3_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    secrets: zod_1.z.optional(GitHubSecrets),
    terraform_apply_config: zod_1.z.optional(JobConfig),
    terraform_plan_config: zod_1.z.optional(JobConfig),
    tfmigrate_apply_config: zod_1.z.optional(JobConfig),
    tfmigrate_plan_config: zod_1.z.optional(JobConfig),
});
const Config = zod_1.z.object({
    aqua: zod_1.z.optional(zod_1.z.object({
        update_checksum: zod_1.z.optional(zod_1.z.object({
            enabled: zod_1.z.optional(zod_1.z.boolean()),
            skip_push: zod_1.z.optional(zod_1.z.boolean()),
            prune: zod_1.z.optional(zod_1.z.boolean()),
        })),
    })),
    base_working_directory: zod_1.z.optional(zod_1.z.string()),
    conftest_policy_directory: zod_1.z.optional(zod_1.z.string()),
    draft_pr: zod_1.z.optional(zod_1.z.boolean()),
    drift_detection: zod_1.z.optional(zod_1.z.object({
        issue_repo_owner: zod_1.z.optional(zod_1.z.string()),
        issue_repo_name: zod_1.z.optional(zod_1.z.string()),
        num_of_issues: zod_1.z.optional(zod_1.z.number()),
        minimum_detection_interval: zod_1.z.optional(zod_1.z.number()),
    })),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    label_prefixes: zod_1.z.optional(zod_1.z.object({
        target: zod_1.z.optional(zod_1.z.string()),
        tfmigrate: zod_1.z.optional(zod_1.z.string()),
        skip: zod_1.z.optional(zod_1.z.string()),
    })),
    module_base_directory: zod_1.z.optional(zod_1.z.string()),
    module_file: zod_1.z.optional(zod_1.z.string()),
    plan_workflow_name: zod_1.z.string(),
    renovate_login: zod_1.z.optional(zod_1.z.string()),
    renovate_terraform_labels: zod_1.z.optional(zod_1.z.array(zod_1.z.string())),
    scaffold_working_directory: zod_1.z.optional(zod_1.z.object({
        skip_adding_aqua_packages: zod_1.z.optional(zod_1.z.boolean()),
    })),
    skip_create_pr: zod_1.z.optional(zod_1.z.boolean()),
    skip_terraform_by_renovate: zod_1.z.optional(zod_1.z.boolean()),
    target_groups: zod_1.z.array(TargetGroup),
    tflint: zod_1.z.optional(TflintConfig),
    tfsec: zod_1.z.optional(TfsecConfig),
    trivy: zod_1.z.optional(TrivyConfig),
    update_local_path_module_caller: zod_1.z.optional(zod_1.z.object({
        enabled: zod_1.z.optional(zod_1.z.boolean()),
    })),
    update_related_pull_requests: zod_1.z.optional(zod_1.z.object({
        enabled: zod_1.z.optional(zod_1.z.boolean()),
    })),
    working_directory_file: zod_1.z.optional(zod_1.z.string()),
});
const getConfig = () => {
    let configFilePath = process.env.TFACTION_CONFIG;
    if (!configFilePath) {
        configFilePath = "tfaction-root.yaml";
    }
    return Config.parse((0, js_yaml_1.load)(fs.readFileSync(configFilePath, "utf8")));
};
exports.getConfig = getConfig;
const getTarget = () => {
    const target = process.env.TFACTION_TARGET;
    if (target) {
        return target;
    }
    throw new Error("the environment variable TFACTION_TARGET is required");
};
exports.getTarget = getTarget;
const getIsApply = () => {
    return process.env.TFACTION_IS_APPLY === "true";
};
exports.getIsApply = getIsApply;
const getTargetFromTargetGroups = (targetGroups, target) => {
    for (let i = 0; i < targetGroups.length; i++) {
        const targetConfig = targetGroups[i];
        if (target.startsWith(targetConfig.target)) {
            return targetConfig;
        }
    }
    return undefined;
};
exports.getTargetFromTargetGroups = getTargetFromTargetGroups;
const getTargetFromTargetGroupsByWorkingDir = (targetGroups, wd) => {
    for (let i = 0; i < targetGroups.length; i++) {
        const targetConfig = targetGroups[i];
        if (wd.startsWith(targetConfig.working_directory)) {
            return targetConfig;
        }
    }
    return undefined;
};
exports.getTargetFromTargetGroupsByWorkingDir = getTargetFromTargetGroupsByWorkingDir;
const readTargetConfig = (p) => {
    return TargetConfig.parse((0, js_yaml_1.load)(fs.readFileSync(p, "utf8")));
};
exports.readTargetConfig = readTargetConfig;
const getJobConfig = (config, isApply, jobType) => {
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
exports.getJobConfig = getJobConfig;
const setValues = (name, values) => {
    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (value != undefined) {
            core.setOutput(name, value);
            return;
        }
    }
};
exports.setValues = setValues;
const setOutputs = (keys, objs) => {
    const outputs = new Map();
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
exports.setOutputs = setOutputs;
const setEnvs = (...objs) => {
    const envs = new Map();
    for (const obj of objs) {
        if (obj === null || obj === void 0 ? void 0 : obj.env) {
            for (const [key, value] of Object.entries(obj.env)) {
                envs.set(key, value);
            }
        }
    }
    return envs;
};
exports.setEnvs = setEnvs;
function getTargetGroup(targets, target) {
    for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (target.startsWith(t.target)) {
            return t;
        }
    }
    throw new Error("target is invalid");
}
exports.getTargetGroup = getTargetGroup;
