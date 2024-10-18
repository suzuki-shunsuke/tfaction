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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTargetGroup = exports.setEnvs = exports.setOutputs = exports.setValues = exports.getJobConfig = exports.readTargetConfig = exports.getTargetFromTargetGroupsByWorkingDir = exports.getIsApply = exports.getWorkingDir = exports.getTarget = exports.createWDTargetMap = exports.getConfig = exports.getJobType = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
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
const TerraformDocsConfig = zod_1.z.object({
    enabled: zod_1.z.optional(zod_1.z.boolean()),
});
const ConftestPolicyConfig = zod_1.z.object({
    tf: zod_1.z.optional(zod_1.z.boolean()),
    plan: zod_1.z.optional(zod_1.z.boolean()),
    id: zod_1.z.optional(zod_1.z.string()),
    enabled: zod_1.z.optional(zod_1.z.boolean()),
    policy: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
    data: zod_1.z.optional(zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])),
    fail_on_warn: zod_1.z.optional(zod_1.z.boolean()),
    no_fail: zod_1.z.optional(zod_1.z.boolean()),
    all_namespaces: zod_1.z.optional(zod_1.z.boolean()),
    quiet: zod_1.z.optional(zod_1.z.boolean()),
    trace: zod_1.z.optional(zod_1.z.boolean()),
    strict: zod_1.z.optional(zod_1.z.boolean()),
    show_builtin_errors: zod_1.z.optional(zod_1.z.boolean()),
    junit_hide_message: zod_1.z.optional(zod_1.z.boolean()),
    suppress_exceptions: zod_1.z.optional(zod_1.z.boolean()),
    combine: zod_1.z.optional(zod_1.z.boolean()),
    tls: zod_1.z.optional(zod_1.z.boolean()),
    ignore: zod_1.z.optional(zod_1.z.string()),
    parser: zod_1.z.optional(zod_1.z.string()),
    capabilities: zod_1.z.optional(zod_1.z.string()),
    output: zod_1.z.optional(zod_1.z.string()),
    namespaces: zod_1.z.optional(zod_1.z.array(zod_1.z.string())),
    proto_file_dirs: zod_1.z.optional(zod_1.z.array(zod_1.z.string())),
    paths: zod_1.z.optional(zod_1.z.array(zod_1.z.string())),
});
const ConftestConfig = zod_1.z.object({
    disable_all: zod_1.z.optional(zod_1.z.boolean()),
    policies: zod_1.z.optional(zod_1.z.array(ConftestPolicyConfig)),
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
    aws_role_session_name: zod_1.z.optional(zod_1.z.string()),
    gcp_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    gcp_access_token_scopes: zod_1.z.optional(zod_1.z.string()),
    gcp_remote_backend_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_remote_backend_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    environment: zod_1.z.optional(GitHubEnvironment),
    secrets: zod_1.z.optional(GitHubSecrets),
    runs_on: zod_1.z.optional(zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    aws_secrets_manager: zod_1.z.optional(zod_1.z.array(AWSSecretsManagerSecret)),
});
const TargetGroup = zod_1.z.object({
    aws_region: zod_1.z.optional(zod_1.z.string()),
    aws_assume_role_arn: zod_1.z.optional(zod_1.z.string()),
    aws_role_session_name: zod_1.z.optional(zod_1.z.string()),
    destroy: zod_1.z.optional(zod_1.z.boolean()),
    env: zod_1.z.optional(zod_1.z.record(zod_1.z.string())),
    environment: zod_1.z.optional(GitHubEnvironment),
    gcp_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    gcp_remote_backend_service_account: zod_1.z.optional(zod_1.z.string()),
    gcp_remote_backend_workload_identity_provider: zod_1.z.optional(zod_1.z.string()),
    gcs_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    runs_on: zod_1.z.optional(zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])),
    secrets: zod_1.z.optional(GitHubSecrets),
    s3_bucket_name_tfmigrate_history: zod_1.z.optional(zod_1.z.string()),
    target: zod_1.z.optional(zod_1.z.string()),
    template_dir: zod_1.z.optional(zod_1.z.string()),
    terraform_apply_config: zod_1.z.optional(JobConfig),
    terraform_plan_config: zod_1.z.optional(JobConfig),
    tfmigrate_apply_config: zod_1.z.optional(JobConfig),
    tfmigrate_plan_config: zod_1.z.optional(JobConfig),
    working_directory: zod_1.z.string(),
    aws_secrets_manager: zod_1.z.optional(zod_1.z.array(AWSSecretsManagerSecret)),
    terraform_command: zod_1.z.optional(zod_1.z.string()),
    conftest: zod_1.z.optional(ConftestConfig),
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
    terraform_command: zod_1.z.optional(zod_1.z.string()),
    terraform_docs: zod_1.z.optional(TerraformDocsConfig),
    conftest: zod_1.z.optional(ConftestConfig),
});
const Replace = zod_1.z.object({
    patterns: zod_1.z.array(zod_1.z.object({
        regexp: zod_1.z.string(),
        replace: zod_1.z.string(),
        flags: zod_1.z.optional(zod_1.z.string()),
    })),
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
    conftest: zod_1.z.optional(ConftestConfig),
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
    terraform_docs: zod_1.z.optional(TerraformDocsConfig),
    update_local_path_module_caller: zod_1.z.optional(zod_1.z.object({
        enabled: zod_1.z.optional(zod_1.z.boolean()),
    })),
    terraform_command: zod_1.z.optional(zod_1.z.string()),
    update_related_pull_requests: zod_1.z.optional(zod_1.z.object({
        enabled: zod_1.z.optional(zod_1.z.boolean()),
    })),
    working_directory_file: zod_1.z.optional(zod_1.z.string()),
    replace: zod_1.z.optional(Replace),
});
const getConfig = () => {
    let configFilePath = process.env.TFACTION_CONFIG;
    if (!configFilePath) {
        configFilePath = "tfaction-root.yaml";
    }
    return Config.parse((0, js_yaml_1.load)(fs.readFileSync(configFilePath, "utf8")));
};
exports.getConfig = getConfig;
const createWDTargetMap = (wds, config) => {
    var _a, _b;
    const m = new Map();
    for (const wd of wds) {
        let target = wd;
        for (const tg of config.target_groups) {
            if (!wd.startsWith(tg.working_directory)) {
                continue;
            }
            if (tg.target !== undefined) {
                target = tg.target + wd.slice(tg.working_directory.length);
            }
            for (const pattern of (_b = (_a = config.replace) === null || _a === void 0 ? void 0 : _a.patterns) !== null && _b !== void 0 ? _b : []) {
                target = target.replace(new RegExp(pattern.regexp, pattern.flags), pattern.replace);
            }
            break;
        }
        m.set(wd, target);
    }
    return m;
};
exports.createWDTargetMap = createWDTargetMap;
const getTarget = () => {
    return process.env.TFACTION_TARGET;
};
exports.getTarget = getTarget;
const getWorkingDir = () => {
    return process.env.TFACTION_WORKING_DIR;
};
exports.getWorkingDir = getWorkingDir;
const getIsApply = () => {
    return process.env.TFACTION_IS_APPLY === "true";
};
exports.getIsApply = getIsApply;
const getTargetFromTargetGroupsByWorkingDir = (targetGroups, wd) => {
    for (const targetConfig of targetGroups) {
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
    for (const value of values) {
        if (value != undefined) {
            core.setOutput(name, value);
            return;
        }
    }
};
exports.setValues = setValues;
const setOutputs = (keys, objs) => {
    const outputs = new Map();
    for (const key of keys) {
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
const getTargetGroup = (config, target, workingDir) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (workingDir) {
        const targetConfig = (0, exports.getTargetFromTargetGroupsByWorkingDir)(config.target_groups, workingDir);
        if (!targetConfig) {
            throw new Error("target config is not found in target_groups");
        }
        target = workingDir;
        for (const pattern of (_b = (_a = config.replace) === null || _a === void 0 ? void 0 : _a.patterns) !== null && _b !== void 0 ? _b : []) {
            target = target.replace(new RegExp(pattern.regexp), pattern.replace);
        }
        if (targetConfig.target !== undefined) {
            target = workingDir.replace(targetConfig.working_directory, targetConfig.target);
        }
        return {
            target: target,
            workingDir: workingDir,
            group: targetConfig,
        };
    }
    if (target === undefined) {
        throw new Error("Either TFACTION_TARGET or TFACTION_WORKING_DIR is required");
    }
    const out = yield exec.getExecOutput("git", ["ls-files"], {
        silent: true,
    });
    const wds = [];
    for (const line of out.stdout.split("\n")) {
        if (line.endsWith((_c = config.working_directory_file) !== null && _c !== void 0 ? _c : "tfaction.yaml")) {
            wds.push(path.dirname(line));
        }
    }
    const m = (0, exports.createWDTargetMap)(wds, config);
    for (const [wd, t] of m) {
        if (t === target) {
            workingDir = wd;
            break;
        }
    }
    if (workingDir === undefined) {
        throw new Error(`No working directory is found for the target ${target}`);
    }
    const targetConfig = (0, exports.getTargetFromTargetGroupsByWorkingDir)(config.target_groups, workingDir);
    if (!targetConfig) {
        throw new Error("target config is not found in target_groups");
    }
    return {
        target: target,
        workingDir: workingDir,
        group: targetConfig,
    };
});
exports.getTargetGroup = getTargetGroup;
