import { z } from "zod";
declare const GitHubEnvironment: z.ZodUnion<[z.ZodString, z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    url: string;
}, {
    name: string;
    url: string;
}>]>;
export type GitHubEnvironment = z.infer<typeof GitHubEnvironment>;
declare const JobType: z.ZodUnion<[z.ZodLiteral<"terraform">, z.ZodLiteral<"tfmigrate">, z.ZodLiteral<"scaffold_working_dir">]>;
export type JobType = z.infer<typeof JobType>;
export declare const getJobType: () => JobType;
declare const TfsecConfig: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
}, {
    enabled?: boolean | undefined;
}>;
export type TfsecConfig = z.infer<typeof TfsecConfig>;
declare const TflintConfig: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
}, {
    enabled?: boolean | undefined;
}>;
export type TflintConfig = z.infer<typeof TflintConfig>;
declare const TrivyConfig: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
}, {
    enabled?: boolean | undefined;
}>;
export type TrivyConfig = z.infer<typeof TrivyConfig>;
declare const TerraformDocsConfig: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    enabled?: boolean | undefined;
}, {
    enabled?: boolean | undefined;
}>;
export type TerraformDocsConfig = z.infer<typeof TerraformDocsConfig>;
declare const ConftestPolicyConfig: z.ZodObject<{
    tf: z.ZodOptional<z.ZodBoolean>;
    plan: z.ZodOptional<z.ZodBoolean>;
    id: z.ZodOptional<z.ZodString>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
    data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    fail_on_warn: z.ZodOptional<z.ZodBoolean>;
    no_fail: z.ZodOptional<z.ZodBoolean>;
    all_namespaces: z.ZodOptional<z.ZodBoolean>;
    quiet: z.ZodOptional<z.ZodBoolean>;
    trace: z.ZodOptional<z.ZodBoolean>;
    strict: z.ZodOptional<z.ZodBoolean>;
    show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
    junit_hide_message: z.ZodOptional<z.ZodBoolean>;
    suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
    combine: z.ZodOptional<z.ZodBoolean>;
    tls: z.ZodOptional<z.ZodBoolean>;
    ignore: z.ZodOptional<z.ZodString>;
    parser: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    policy: string | string[];
    data?: string | string[] | undefined;
    strict?: boolean | undefined;
    id?: string | undefined;
    output?: string | undefined;
    ignore?: string | undefined;
    tls?: boolean | undefined;
    enabled?: boolean | undefined;
    tf?: boolean | undefined;
    plan?: boolean | undefined;
    fail_on_warn?: boolean | undefined;
    no_fail?: boolean | undefined;
    all_namespaces?: boolean | undefined;
    quiet?: boolean | undefined;
    trace?: boolean | undefined;
    show_builtin_errors?: boolean | undefined;
    junit_hide_message?: boolean | undefined;
    suppress_exceptions?: boolean | undefined;
    combine?: boolean | undefined;
    parser?: string | undefined;
    capabilities?: string | undefined;
    namespaces?: string[] | undefined;
    proto_file_dirs?: string[] | undefined;
    paths?: string[] | undefined;
}, {
    policy: string | string[];
    data?: string | string[] | undefined;
    strict?: boolean | undefined;
    id?: string | undefined;
    output?: string | undefined;
    ignore?: string | undefined;
    tls?: boolean | undefined;
    enabled?: boolean | undefined;
    tf?: boolean | undefined;
    plan?: boolean | undefined;
    fail_on_warn?: boolean | undefined;
    no_fail?: boolean | undefined;
    all_namespaces?: boolean | undefined;
    quiet?: boolean | undefined;
    trace?: boolean | undefined;
    show_builtin_errors?: boolean | undefined;
    junit_hide_message?: boolean | undefined;
    suppress_exceptions?: boolean | undefined;
    combine?: boolean | undefined;
    parser?: string | undefined;
    capabilities?: string | undefined;
    namespaces?: string[] | undefined;
    proto_file_dirs?: string[] | undefined;
    paths?: string[] | undefined;
}>;
export type ConftestPolicyConfig = z.infer<typeof ConftestPolicyConfig>;
declare const ConftestConfig: z.ZodObject<{
    disable_all: z.ZodOptional<z.ZodBoolean>;
    policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        tf: z.ZodOptional<z.ZodBoolean>;
        plan: z.ZodOptional<z.ZodBoolean>;
        id: z.ZodOptional<z.ZodString>;
        enabled: z.ZodOptional<z.ZodBoolean>;
        policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
        data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        fail_on_warn: z.ZodOptional<z.ZodBoolean>;
        no_fail: z.ZodOptional<z.ZodBoolean>;
        all_namespaces: z.ZodOptional<z.ZodBoolean>;
        quiet: z.ZodOptional<z.ZodBoolean>;
        trace: z.ZodOptional<z.ZodBoolean>;
        strict: z.ZodOptional<z.ZodBoolean>;
        show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
        junit_hide_message: z.ZodOptional<z.ZodBoolean>;
        suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
        combine: z.ZodOptional<z.ZodBoolean>;
        tls: z.ZodOptional<z.ZodBoolean>;
        ignore: z.ZodOptional<z.ZodString>;
        parser: z.ZodOptional<z.ZodString>;
        capabilities: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        policy: string | string[];
        data?: string | string[] | undefined;
        strict?: boolean | undefined;
        id?: string | undefined;
        output?: string | undefined;
        ignore?: string | undefined;
        tls?: boolean | undefined;
        enabled?: boolean | undefined;
        tf?: boolean | undefined;
        plan?: boolean | undefined;
        fail_on_warn?: boolean | undefined;
        no_fail?: boolean | undefined;
        all_namespaces?: boolean | undefined;
        quiet?: boolean | undefined;
        trace?: boolean | undefined;
        show_builtin_errors?: boolean | undefined;
        junit_hide_message?: boolean | undefined;
        suppress_exceptions?: boolean | undefined;
        combine?: boolean | undefined;
        parser?: string | undefined;
        capabilities?: string | undefined;
        namespaces?: string[] | undefined;
        proto_file_dirs?: string[] | undefined;
        paths?: string[] | undefined;
    }, {
        policy: string | string[];
        data?: string | string[] | undefined;
        strict?: boolean | undefined;
        id?: string | undefined;
        output?: string | undefined;
        ignore?: string | undefined;
        tls?: boolean | undefined;
        enabled?: boolean | undefined;
        tf?: boolean | undefined;
        plan?: boolean | undefined;
        fail_on_warn?: boolean | undefined;
        no_fail?: boolean | undefined;
        all_namespaces?: boolean | undefined;
        quiet?: boolean | undefined;
        trace?: boolean | undefined;
        show_builtin_errors?: boolean | undefined;
        junit_hide_message?: boolean | undefined;
        suppress_exceptions?: boolean | undefined;
        combine?: boolean | undefined;
        parser?: string | undefined;
        capabilities?: string | undefined;
        namespaces?: string[] | undefined;
        proto_file_dirs?: string[] | undefined;
        paths?: string[] | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    disable_all?: boolean | undefined;
    policies?: {
        policy: string | string[];
        data?: string | string[] | undefined;
        strict?: boolean | undefined;
        id?: string | undefined;
        output?: string | undefined;
        ignore?: string | undefined;
        tls?: boolean | undefined;
        enabled?: boolean | undefined;
        tf?: boolean | undefined;
        plan?: boolean | undefined;
        fail_on_warn?: boolean | undefined;
        no_fail?: boolean | undefined;
        all_namespaces?: boolean | undefined;
        quiet?: boolean | undefined;
        trace?: boolean | undefined;
        show_builtin_errors?: boolean | undefined;
        junit_hide_message?: boolean | undefined;
        suppress_exceptions?: boolean | undefined;
        combine?: boolean | undefined;
        parser?: string | undefined;
        capabilities?: string | undefined;
        namespaces?: string[] | undefined;
        proto_file_dirs?: string[] | undefined;
        paths?: string[] | undefined;
    }[] | undefined;
}, {
    disable_all?: boolean | undefined;
    policies?: {
        policy: string | string[];
        data?: string | string[] | undefined;
        strict?: boolean | undefined;
        id?: string | undefined;
        output?: string | undefined;
        ignore?: string | undefined;
        tls?: boolean | undefined;
        enabled?: boolean | undefined;
        tf?: boolean | undefined;
        plan?: boolean | undefined;
        fail_on_warn?: boolean | undefined;
        no_fail?: boolean | undefined;
        all_namespaces?: boolean | undefined;
        quiet?: boolean | undefined;
        trace?: boolean | undefined;
        show_builtin_errors?: boolean | undefined;
        junit_hide_message?: boolean | undefined;
        suppress_exceptions?: boolean | undefined;
        combine?: boolean | undefined;
        parser?: string | undefined;
        capabilities?: string | undefined;
        namespaces?: string[] | undefined;
        proto_file_dirs?: string[] | undefined;
        paths?: string[] | undefined;
    }[] | undefined;
}>;
export type ConftestConfig = z.infer<typeof ConftestConfig>;
declare const GitHubSecrets: z.ZodArray<z.ZodObject<{
    env_name: z.ZodString;
    secret_name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    env_name: string;
    secret_name: string;
}, {
    env_name: string;
    secret_name: string;
}>, "many">;
export type GitHubSecrets = z.infer<typeof GitHubSecrets>;
declare const AWSSecretsManagerSecretEnv: z.ZodObject<{
    env_name: z.ZodString;
    secret_key: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    env_name: string;
    secret_key?: string | undefined;
}, {
    env_name: string;
    secret_key?: string | undefined;
}>;
export type AWSSecretsManagerSecretEnv = z.infer<typeof AWSSecretsManagerSecretEnv>;
declare const AWSSecretsManagerSecret: z.ZodObject<{
    envs: z.ZodArray<z.ZodObject<{
        env_name: z.ZodString;
        secret_key: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        env_name: string;
        secret_key?: string | undefined;
    }, {
        env_name: string;
        secret_key?: string | undefined;
    }>, "many">;
    secret_id: z.ZodString;
    version_id: z.ZodOptional<z.ZodString>;
    version_stage: z.ZodOptional<z.ZodString>;
    aws_region: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    envs: {
        env_name: string;
        secret_key?: string | undefined;
    }[];
    secret_id: string;
    version_id?: string | undefined;
    version_stage?: string | undefined;
    aws_region?: string | undefined;
}, {
    envs: {
        env_name: string;
        secret_key?: string | undefined;
    }[];
    secret_id: string;
    version_id?: string | undefined;
    version_stage?: string | undefined;
    aws_region?: string | undefined;
}>;
export type AWSSecretsManagerSecret = z.infer<typeof AWSSecretsManagerSecret>;
declare const JobConfig: z.ZodObject<{
    aws_assume_role_arn: z.ZodOptional<z.ZodString>;
    aws_role_session_name: z.ZodOptional<z.ZodString>;
    gcp_service_account: z.ZodOptional<z.ZodString>;
    gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
    gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
    gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
    gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        url: string;
    }, {
        name: string;
        url: string;
    }>]>>;
    secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        env_name: z.ZodString;
        secret_name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        env_name: string;
        secret_name: string;
    }, {
        env_name: string;
        secret_name: string;
    }>, "many">>;
    runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
        envs: z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_key: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_key?: string | undefined;
        }, {
            env_name: string;
            secret_key?: string | undefined;
        }>, "many">;
        secret_id: z.ZodString;
        version_id: z.ZodOptional<z.ZodString>;
        version_stage: z.ZodOptional<z.ZodString>;
        aws_region: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }, {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    environment?: string | {
        name: string;
        url: string;
    } | undefined;
    env?: Record<string, string> | undefined;
    aws_assume_role_arn?: string | undefined;
    aws_role_session_name?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcp_access_token_scopes?: string | undefined;
    gcp_remote_backend_service_account?: string | undefined;
    gcp_remote_backend_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | string[] | undefined;
    aws_secrets_manager?: {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }[] | undefined;
}, {
    environment?: string | {
        name: string;
        url: string;
    } | undefined;
    env?: Record<string, string> | undefined;
    aws_assume_role_arn?: string | undefined;
    aws_role_session_name?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcp_access_token_scopes?: string | undefined;
    gcp_remote_backend_service_account?: string | undefined;
    gcp_remote_backend_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | string[] | undefined;
    aws_secrets_manager?: {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }[] | undefined;
}>;
export type JobConfig = z.infer<typeof JobConfig>;
declare const TargetGroup: z.ZodObject<{
    aws_region: z.ZodOptional<z.ZodString>;
    aws_assume_role_arn: z.ZodOptional<z.ZodString>;
    aws_role_session_name: z.ZodOptional<z.ZodString>;
    destroy: z.ZodOptional<z.ZodBoolean>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        url: string;
    }, {
        name: string;
        url: string;
    }>]>>;
    gcp_service_account: z.ZodOptional<z.ZodString>;
    gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
    gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
    gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
    gcs_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
    runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        env_name: z.ZodString;
        secret_name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        env_name: string;
        secret_name: string;
    }, {
        env_name: string;
        secret_name: string;
    }>, "many">>;
    s3_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
    target: z.ZodOptional<z.ZodString>;
    template_dir: z.ZodOptional<z.ZodString>;
    terraform_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    terraform_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    tfmigrate_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    tfmigrate_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    working_directory: z.ZodString;
    aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
        envs: z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_key: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_key?: string | undefined;
        }, {
            env_name: string;
            secret_key?: string | undefined;
        }>, "many">;
        secret_id: z.ZodString;
        version_id: z.ZodOptional<z.ZodString>;
        version_stage: z.ZodOptional<z.ZodString>;
        aws_region: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }, {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }>, "many">>;
    terraform_command: z.ZodOptional<z.ZodString>;
    conftest: z.ZodOptional<z.ZodObject<{
        disable_all: z.ZodOptional<z.ZodBoolean>;
        policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
            tf: z.ZodOptional<z.ZodBoolean>;
            plan: z.ZodOptional<z.ZodBoolean>;
            id: z.ZodOptional<z.ZodString>;
            enabled: z.ZodOptional<z.ZodBoolean>;
            policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            fail_on_warn: z.ZodOptional<z.ZodBoolean>;
            no_fail: z.ZodOptional<z.ZodBoolean>;
            all_namespaces: z.ZodOptional<z.ZodBoolean>;
            quiet: z.ZodOptional<z.ZodBoolean>;
            trace: z.ZodOptional<z.ZodBoolean>;
            strict: z.ZodOptional<z.ZodBoolean>;
            show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
            junit_hide_message: z.ZodOptional<z.ZodBoolean>;
            suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
            combine: z.ZodOptional<z.ZodBoolean>;
            tls: z.ZodOptional<z.ZodBoolean>;
            ignore: z.ZodOptional<z.ZodString>;
            parser: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodString>;
            output: z.ZodOptional<z.ZodString>;
            namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    working_directory: string;
    target?: string | undefined;
    environment?: string | {
        name: string;
        url: string;
    } | undefined;
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    aws_role_session_name?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcp_remote_backend_service_account?: string | undefined;
    gcp_remote_backend_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | string[] | undefined;
    aws_secrets_manager?: {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }[] | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    template_dir?: string | undefined;
    terraform_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
}, {
    working_directory: string;
    target?: string | undefined;
    environment?: string | {
        name: string;
        url: string;
    } | undefined;
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    aws_role_session_name?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcp_remote_backend_service_account?: string | undefined;
    gcp_remote_backend_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | string[] | undefined;
    aws_secrets_manager?: {
        envs: {
            env_name: string;
            secret_key?: string | undefined;
        }[];
        secret_id: string;
        version_id?: string | undefined;
        version_stage?: string | undefined;
        aws_region?: string | undefined;
    }[] | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    template_dir?: string | undefined;
    terraform_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
}>;
export type TargetGroup = z.infer<typeof TargetGroup>;
declare const TargetConfig: z.ZodObject<{
    aws_assume_role_arn: z.ZodOptional<z.ZodString>;
    aws_region: z.ZodOptional<z.ZodString>;
    destroy: z.ZodOptional<z.ZodBoolean>;
    drift_detection: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    gcs_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
    gcp_service_account: z.ZodOptional<z.ZodString>;
    gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
    providers_lock_opts: z.ZodOptional<z.ZodString>;
    s3_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
    secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        env_name: z.ZodString;
        secret_name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        env_name: string;
        secret_name: string;
    }, {
        env_name: string;
        secret_name: string;
    }>, "many">>;
    terraform_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    terraform_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    tfmigrate_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    tfmigrate_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }, {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    }>>;
    terraform_command: z.ZodOptional<z.ZodString>;
    terraform_docs: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    conftest: z.ZodOptional<z.ZodObject<{
        disable_all: z.ZodOptional<z.ZodBoolean>;
        policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
            tf: z.ZodOptional<z.ZodBoolean>;
            plan: z.ZodOptional<z.ZodBoolean>;
            id: z.ZodOptional<z.ZodString>;
            enabled: z.ZodOptional<z.ZodBoolean>;
            policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            fail_on_warn: z.ZodOptional<z.ZodBoolean>;
            no_fail: z.ZodOptional<z.ZodBoolean>;
            all_namespaces: z.ZodOptional<z.ZodBoolean>;
            quiet: z.ZodOptional<z.ZodBoolean>;
            trace: z.ZodOptional<z.ZodBoolean>;
            strict: z.ZodOptional<z.ZodBoolean>;
            show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
            junit_hide_message: z.ZodOptional<z.ZodBoolean>;
            suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
            combine: z.ZodOptional<z.ZodBoolean>;
            tls: z.ZodOptional<z.ZodBoolean>;
            ignore: z.ZodOptional<z.ZodString>;
            parser: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodString>;
            output: z.ZodOptional<z.ZodString>;
            namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    terraform_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    drift_detection?: {
        enabled?: boolean | undefined;
    } | undefined;
    providers_lock_opts?: string | undefined;
    terraform_docs?: {
        enabled?: boolean | undefined;
    } | undefined;
}, {
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    terraform_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        env?: Record<string, string> | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_access_token_scopes?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
    } | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    drift_detection?: {
        enabled?: boolean | undefined;
    } | undefined;
    providers_lock_opts?: string | undefined;
    terraform_docs?: {
        enabled?: boolean | undefined;
    } | undefined;
}>;
export type TargetConfig = z.infer<typeof TargetConfig>;
declare const Replace: z.ZodObject<{
    patterns: z.ZodArray<z.ZodObject<{
        regexp: z.ZodString;
        replace: z.ZodString;
        flags: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        replace: string;
        regexp: string;
        flags?: string | undefined;
    }, {
        replace: string;
        regexp: string;
        flags?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    patterns: {
        replace: string;
        regexp: string;
        flags?: string | undefined;
    }[];
}, {
    patterns: {
        replace: string;
        regexp: string;
        flags?: string | undefined;
    }[];
}>;
export type Replace = z.infer<typeof Replace>;
declare const Config: z.ZodObject<{
    aqua: z.ZodOptional<z.ZodObject<{
        update_checksum: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            skip_push: z.ZodOptional<z.ZodBoolean>;
            prune: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        }, {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    }, {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    }>>;
    base_working_directory: z.ZodOptional<z.ZodString>;
    conftest_policy_directory: z.ZodOptional<z.ZodString>;
    conftest: z.ZodOptional<z.ZodObject<{
        disable_all: z.ZodOptional<z.ZodBoolean>;
        policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
            tf: z.ZodOptional<z.ZodBoolean>;
            plan: z.ZodOptional<z.ZodBoolean>;
            id: z.ZodOptional<z.ZodString>;
            enabled: z.ZodOptional<z.ZodBoolean>;
            policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
            data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            fail_on_warn: z.ZodOptional<z.ZodBoolean>;
            no_fail: z.ZodOptional<z.ZodBoolean>;
            all_namespaces: z.ZodOptional<z.ZodBoolean>;
            quiet: z.ZodOptional<z.ZodBoolean>;
            trace: z.ZodOptional<z.ZodBoolean>;
            strict: z.ZodOptional<z.ZodBoolean>;
            show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
            junit_hide_message: z.ZodOptional<z.ZodBoolean>;
            suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
            combine: z.ZodOptional<z.ZodBoolean>;
            tls: z.ZodOptional<z.ZodBoolean>;
            ignore: z.ZodOptional<z.ZodString>;
            parser: z.ZodOptional<z.ZodString>;
            capabilities: z.ZodOptional<z.ZodString>;
            output: z.ZodOptional<z.ZodString>;
            namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }, {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }, {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    }>>;
    draft_pr: z.ZodOptional<z.ZodBoolean>;
    drift_detection: z.ZodOptional<z.ZodObject<{
        issue_repo_owner: z.ZodOptional<z.ZodString>;
        issue_repo_name: z.ZodOptional<z.ZodString>;
        num_of_issues: z.ZodOptional<z.ZodNumber>;
        minimum_detection_interval: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    }, {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    }>>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    label_prefixes: z.ZodOptional<z.ZodObject<{
        target: z.ZodOptional<z.ZodString>;
        tfmigrate: z.ZodOptional<z.ZodString>;
        skip: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        target?: string | undefined;
        skip?: string | undefined;
        tfmigrate?: string | undefined;
    }, {
        target?: string | undefined;
        skip?: string | undefined;
        tfmigrate?: string | undefined;
    }>>;
    module_base_directory: z.ZodOptional<z.ZodString>;
    module_file: z.ZodOptional<z.ZodString>;
    plan_workflow_name: z.ZodString;
    renovate_login: z.ZodOptional<z.ZodString>;
    renovate_terraform_labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    scaffold_working_directory: z.ZodOptional<z.ZodObject<{
        skip_adding_aqua_packages: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        skip_adding_aqua_packages?: boolean | undefined;
    }, {
        skip_adding_aqua_packages?: boolean | undefined;
    }>>;
    skip_create_pr: z.ZodOptional<z.ZodBoolean>;
    skip_terraform_by_renovate: z.ZodOptional<z.ZodBoolean>;
    target_groups: z.ZodArray<z.ZodObject<{
        aws_region: z.ZodOptional<z.ZodString>;
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        aws_role_session_name: z.ZodOptional<z.ZodString>;
        destroy: z.ZodOptional<z.ZodBoolean>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            name: string;
            url: string;
        }, {
            name: string;
            url: string;
        }>]>>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
        gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcs_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
        runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
            env_name: z.ZodString;
            secret_name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            env_name: string;
            secret_name: string;
        }, {
            env_name: string;
            secret_name: string;
        }>, "many">>;
        s3_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
        target: z.ZodOptional<z.ZodString>;
        template_dir: z.ZodOptional<z.ZodString>;
        terraform_apply_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            aws_role_session_name: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>]>>;
            secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_name: string;
            }, {
                env_name: string;
                secret_name: string;
            }>, "many">>;
            runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
                envs: z.ZodArray<z.ZodObject<{
                    env_name: z.ZodString;
                    secret_key: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    env_name: string;
                    secret_key?: string | undefined;
                }, {
                    env_name: string;
                    secret_key?: string | undefined;
                }>, "many">;
                secret_id: z.ZodString;
                version_id: z.ZodOptional<z.ZodString>;
                version_stage: z.ZodOptional<z.ZodString>;
                aws_region: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }>>;
        terraform_plan_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            aws_role_session_name: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>]>>;
            secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_name: string;
            }, {
                env_name: string;
                secret_name: string;
            }>, "many">>;
            runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
                envs: z.ZodArray<z.ZodObject<{
                    env_name: z.ZodString;
                    secret_key: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    env_name: string;
                    secret_key?: string | undefined;
                }, {
                    env_name: string;
                    secret_key?: string | undefined;
                }>, "many">;
                secret_id: z.ZodString;
                version_id: z.ZodOptional<z.ZodString>;
                version_stage: z.ZodOptional<z.ZodString>;
                aws_region: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }>>;
        tfmigrate_apply_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            aws_role_session_name: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>]>>;
            secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_name: string;
            }, {
                env_name: string;
                secret_name: string;
            }>, "many">>;
            runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
                envs: z.ZodArray<z.ZodObject<{
                    env_name: z.ZodString;
                    secret_key: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    env_name: string;
                    secret_key?: string | undefined;
                }, {
                    env_name: string;
                    secret_key?: string | undefined;
                }>, "many">;
                secret_id: z.ZodString;
                version_id: z.ZodOptional<z.ZodString>;
                version_stage: z.ZodOptional<z.ZodString>;
                aws_region: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }>>;
        tfmigrate_plan_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            aws_role_session_name: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            gcp_access_token_scopes: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_service_account: z.ZodOptional<z.ZodString>;
            gcp_remote_backend_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                name: string;
                url: string;
            }, {
                name: string;
                url: string;
            }>]>>;
            secrets: z.ZodOptional<z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_name: string;
            }, {
                env_name: string;
                secret_name: string;
            }>, "many">>;
            runs_on: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
            aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
                envs: z.ZodArray<z.ZodObject<{
                    env_name: z.ZodString;
                    secret_key: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    env_name: string;
                    secret_key?: string | undefined;
                }, {
                    env_name: string;
                    secret_key?: string | undefined;
                }>, "many">;
                secret_id: z.ZodString;
                version_id: z.ZodOptional<z.ZodString>;
                version_stage: z.ZodOptional<z.ZodString>;
                aws_region: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }, {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }, {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        }>>;
        working_directory: z.ZodString;
        aws_secrets_manager: z.ZodOptional<z.ZodArray<z.ZodObject<{
            envs: z.ZodArray<z.ZodObject<{
                env_name: z.ZodString;
                secret_key: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                env_name: string;
                secret_key?: string | undefined;
            }, {
                env_name: string;
                secret_key?: string | undefined;
            }>, "many">;
            secret_id: z.ZodString;
            version_id: z.ZodOptional<z.ZodString>;
            version_stage: z.ZodOptional<z.ZodString>;
            aws_region: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }, {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }>, "many">>;
        terraform_command: z.ZodOptional<z.ZodString>;
        conftest: z.ZodOptional<z.ZodObject<{
            disable_all: z.ZodOptional<z.ZodBoolean>;
            policies: z.ZodOptional<z.ZodArray<z.ZodObject<{
                tf: z.ZodOptional<z.ZodBoolean>;
                plan: z.ZodOptional<z.ZodBoolean>;
                id: z.ZodOptional<z.ZodString>;
                enabled: z.ZodOptional<z.ZodBoolean>;
                policy: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>;
                data: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
                fail_on_warn: z.ZodOptional<z.ZodBoolean>;
                no_fail: z.ZodOptional<z.ZodBoolean>;
                all_namespaces: z.ZodOptional<z.ZodBoolean>;
                quiet: z.ZodOptional<z.ZodBoolean>;
                trace: z.ZodOptional<z.ZodBoolean>;
                strict: z.ZodOptional<z.ZodBoolean>;
                show_builtin_errors: z.ZodOptional<z.ZodBoolean>;
                junit_hide_message: z.ZodOptional<z.ZodBoolean>;
                suppress_exceptions: z.ZodOptional<z.ZodBoolean>;
                combine: z.ZodOptional<z.ZodBoolean>;
                tls: z.ZodOptional<z.ZodBoolean>;
                ignore: z.ZodOptional<z.ZodString>;
                parser: z.ZodOptional<z.ZodString>;
                capabilities: z.ZodOptional<z.ZodString>;
                output: z.ZodOptional<z.ZodString>;
                namespaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                proto_file_dirs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            }, "strip", z.ZodTypeAny, {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }, {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        }, {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        working_directory: string;
        target?: string | undefined;
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_command?: string | undefined;
        conftest?: {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        } | undefined;
    }, {
        working_directory: string;
        target?: string | undefined;
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_command?: string | undefined;
        conftest?: {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        } | undefined;
    }>, "many">;
    tflint: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    tfsec: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    trivy: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    terraform_docs: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    update_local_path_module_caller: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    terraform_command: z.ZodOptional<z.ZodString>;
    update_related_pull_requests: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    working_directory_file: z.ZodOptional<z.ZodString>;
    replace: z.ZodOptional<z.ZodObject<{
        patterns: z.ZodArray<z.ZodObject<{
            regexp: z.ZodString;
            replace: z.ZodString;
            flags: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }, {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        patterns: {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }[];
    }, {
        patterns: {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }[];
    }>>;
}, "strip", z.ZodTypeAny, {
    plan_workflow_name: string;
    target_groups: {
        working_directory: string;
        target?: string | undefined;
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_command?: string | undefined;
        conftest?: {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        } | undefined;
    }[];
    replace?: {
        patterns: {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }[];
    } | undefined;
    env?: Record<string, string> | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    drift_detection?: {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    } | undefined;
    terraform_docs?: {
        enabled?: boolean | undefined;
    } | undefined;
    aqua?: {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    } | undefined;
    base_working_directory?: string | undefined;
    conftest_policy_directory?: string | undefined;
    draft_pr?: boolean | undefined;
    label_prefixes?: {
        target?: string | undefined;
        skip?: string | undefined;
        tfmigrate?: string | undefined;
    } | undefined;
    module_base_directory?: string | undefined;
    module_file?: string | undefined;
    renovate_login?: string | undefined;
    renovate_terraform_labels?: string[] | undefined;
    scaffold_working_directory?: {
        skip_adding_aqua_packages?: boolean | undefined;
    } | undefined;
    skip_create_pr?: boolean | undefined;
    skip_terraform_by_renovate?: boolean | undefined;
    tflint?: {
        enabled?: boolean | undefined;
    } | undefined;
    tfsec?: {
        enabled?: boolean | undefined;
    } | undefined;
    trivy?: {
        enabled?: boolean | undefined;
    } | undefined;
    update_local_path_module_caller?: {
        enabled?: boolean | undefined;
    } | undefined;
    update_related_pull_requests?: {
        enabled?: boolean | undefined;
    } | undefined;
    working_directory_file?: string | undefined;
}, {
    plan_workflow_name: string;
    target_groups: {
        working_directory: string;
        target?: string | undefined;
        environment?: string | {
            name: string;
            url: string;
        } | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        aws_role_session_name?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcp_remote_backend_service_account?: string | undefined;
        gcp_remote_backend_workload_identity_provider?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | string[] | undefined;
        aws_secrets_manager?: {
            envs: {
                env_name: string;
                secret_key?: string | undefined;
            }[];
            secret_id: string;
            version_id?: string | undefined;
            version_stage?: string | undefined;
            aws_region?: string | undefined;
        }[] | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            environment?: string | {
                name: string;
                url: string;
            } | undefined;
            env?: Record<string, string> | undefined;
            aws_assume_role_arn?: string | undefined;
            aws_role_session_name?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            gcp_access_token_scopes?: string | undefined;
            gcp_remote_backend_service_account?: string | undefined;
            gcp_remote_backend_workload_identity_provider?: string | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | string[] | undefined;
            aws_secrets_manager?: {
                envs: {
                    env_name: string;
                    secret_key?: string | undefined;
                }[];
                secret_id: string;
                version_id?: string | undefined;
                version_stage?: string | undefined;
                aws_region?: string | undefined;
            }[] | undefined;
        } | undefined;
        terraform_command?: string | undefined;
        conftest?: {
            disable_all?: boolean | undefined;
            policies?: {
                policy: string | string[];
                data?: string | string[] | undefined;
                strict?: boolean | undefined;
                id?: string | undefined;
                output?: string | undefined;
                ignore?: string | undefined;
                tls?: boolean | undefined;
                enabled?: boolean | undefined;
                tf?: boolean | undefined;
                plan?: boolean | undefined;
                fail_on_warn?: boolean | undefined;
                no_fail?: boolean | undefined;
                all_namespaces?: boolean | undefined;
                quiet?: boolean | undefined;
                trace?: boolean | undefined;
                show_builtin_errors?: boolean | undefined;
                junit_hide_message?: boolean | undefined;
                suppress_exceptions?: boolean | undefined;
                combine?: boolean | undefined;
                parser?: string | undefined;
                capabilities?: string | undefined;
                namespaces?: string[] | undefined;
                proto_file_dirs?: string[] | undefined;
                paths?: string[] | undefined;
            }[] | undefined;
        } | undefined;
    }[];
    replace?: {
        patterns: {
            replace: string;
            regexp: string;
            flags?: string | undefined;
        }[];
    } | undefined;
    env?: Record<string, string> | undefined;
    terraform_command?: string | undefined;
    conftest?: {
        disable_all?: boolean | undefined;
        policies?: {
            policy: string | string[];
            data?: string | string[] | undefined;
            strict?: boolean | undefined;
            id?: string | undefined;
            output?: string | undefined;
            ignore?: string | undefined;
            tls?: boolean | undefined;
            enabled?: boolean | undefined;
            tf?: boolean | undefined;
            plan?: boolean | undefined;
            fail_on_warn?: boolean | undefined;
            no_fail?: boolean | undefined;
            all_namespaces?: boolean | undefined;
            quiet?: boolean | undefined;
            trace?: boolean | undefined;
            show_builtin_errors?: boolean | undefined;
            junit_hide_message?: boolean | undefined;
            suppress_exceptions?: boolean | undefined;
            combine?: boolean | undefined;
            parser?: string | undefined;
            capabilities?: string | undefined;
            namespaces?: string[] | undefined;
            proto_file_dirs?: string[] | undefined;
            paths?: string[] | undefined;
        }[] | undefined;
    } | undefined;
    drift_detection?: {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    } | undefined;
    terraform_docs?: {
        enabled?: boolean | undefined;
    } | undefined;
    aqua?: {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    } | undefined;
    base_working_directory?: string | undefined;
    conftest_policy_directory?: string | undefined;
    draft_pr?: boolean | undefined;
    label_prefixes?: {
        target?: string | undefined;
        skip?: string | undefined;
        tfmigrate?: string | undefined;
    } | undefined;
    module_base_directory?: string | undefined;
    module_file?: string | undefined;
    renovate_login?: string | undefined;
    renovate_terraform_labels?: string[] | undefined;
    scaffold_working_directory?: {
        skip_adding_aqua_packages?: boolean | undefined;
    } | undefined;
    skip_create_pr?: boolean | undefined;
    skip_terraform_by_renovate?: boolean | undefined;
    tflint?: {
        enabled?: boolean | undefined;
    } | undefined;
    tfsec?: {
        enabled?: boolean | undefined;
    } | undefined;
    trivy?: {
        enabled?: boolean | undefined;
    } | undefined;
    update_local_path_module_caller?: {
        enabled?: boolean | undefined;
    } | undefined;
    update_related_pull_requests?: {
        enabled?: boolean | undefined;
    } | undefined;
    working_directory_file?: string | undefined;
}>;
export type Config = z.infer<typeof Config>;
export declare const getConfig: () => Config;
export declare const createWDTargetMap: (wds: string[], config: Config) => Map<string, string>;
export declare const getTarget: () => string | undefined;
export declare const getWorkingDir: () => string | undefined;
export declare const getIsApply: () => boolean;
export declare const getTargetFromTargetGroupsByWorkingDir: (targetGroups: Array<TargetGroup>, wd: string) => TargetGroup | undefined;
export declare const readTargetConfig: (p: string) => TargetConfig;
export declare const getJobConfig: (config: TargetConfig | undefined, isApply: boolean, jobType: JobType) => JobConfig | undefined;
export declare const setValues: (name: string, values: Array<any>) => void;
export declare const setOutputs: (keys: Array<string>, objs: Array<any>) => Map<string, any>;
type HasEnv = {
    env?: Record<string, string>;
};
export declare const setEnvs: (...objs: Array<HasEnv | undefined>) => Map<string, any>;
export type Target = {
    target: string;
    workingDir: string;
    group: TargetGroup;
};
export declare const getTargetGroup: (config: Config, target?: string, workingDir?: string) => Promise<Target>;
export {};
