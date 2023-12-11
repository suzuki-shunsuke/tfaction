import { z } from 'zod';
declare const GitHubEnvironment: z.ZodUnion<[z.ZodString, z.ZodObject<{
    name: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    name: string;
}, {
    url: string;
    name: string;
}>]>;
export type GitHubEnvironment = z.infer<typeof GitHubEnvironment>;
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
declare const JobConfig: z.ZodObject<{
    aws_assume_role_arn: z.ZodOptional<z.ZodString>;
    gcp_service_account: z.ZodOptional<z.ZodString>;
    gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        name: string;
    }, {
        url: string;
        name: string;
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
    runs_on: z.ZodOptional<z.ZodString>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    aws_assume_role_arn?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    environment?: string | {
        url: string;
        name: string;
    } | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | undefined;
    env?: Record<string, string> | undefined;
}, {
    aws_assume_role_arn?: string | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    environment?: string | {
        url: string;
        name: string;
    } | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    runs_on?: string | undefined;
    env?: Record<string, string> | undefined;
}>;
export type JobConfig = z.infer<typeof JobConfig>;
declare const TargetConfig: z.ZodObject<{
    aws_region: z.ZodOptional<z.ZodString>;
    aws_assume_role_arn: z.ZodOptional<z.ZodString>;
    destroy: z.ZodOptional<z.ZodBoolean>;
    env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        name: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        name: string;
    }, {
        url: string;
        name: string;
    }>]>>;
    gcp_service_account: z.ZodOptional<z.ZodString>;
    gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
    gcs_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
    runs_on: z.ZodOptional<z.ZodString>;
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
    target: z.ZodString;
    template_dir: z.ZodOptional<z.ZodString>;
    terraform_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
        }, {
            url: string;
            name: string;
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
        runs_on: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    terraform_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
        }, {
            url: string;
            name: string;
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
        runs_on: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    tfmigrate_apply_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
        }, {
            url: string;
            name: string;
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
        runs_on: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    tfmigrate_plan_config: z.ZodOptional<z.ZodObject<{
        aws_assume_role_arn: z.ZodOptional<z.ZodString>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
        }, {
            url: string;
            name: string;
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
        runs_on: z.ZodOptional<z.ZodString>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }, {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    }>>;
    working_directory: z.ZodString;
}, "strip", z.ZodTypeAny, {
    target: string;
    working_directory: string;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    environment?: string | {
        url: string;
        name: string;
    } | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    runs_on?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    template_dir?: string | undefined;
    terraform_apply_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    terraform_plan_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
}, {
    target: string;
    working_directory: string;
    aws_region?: string | undefined;
    aws_assume_role_arn?: string | undefined;
    destroy?: boolean | undefined;
    env?: Record<string, string> | undefined;
    environment?: string | {
        url: string;
        name: string;
    } | undefined;
    gcp_service_account?: string | undefined;
    gcp_workload_identity_provider?: string | undefined;
    gcs_bucket_name_tfmigrate_history?: string | undefined;
    runs_on?: string | undefined;
    secrets?: {
        env_name: string;
        secret_name: string;
    }[] | undefined;
    s3_bucket_name_tfmigrate_history?: string | undefined;
    template_dir?: string | undefined;
    terraform_apply_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    terraform_plan_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    tfmigrate_apply_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
    tfmigrate_plan_config?: {
        aws_assume_role_arn?: string | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        runs_on?: string | undefined;
        env?: Record<string, string> | undefined;
    } | undefined;
}>;
export type TargetConfig = z.infer<typeof TargetConfig>;
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
        tfmigrate?: string | undefined;
        skip?: string | undefined;
    }, {
        target?: string | undefined;
        tfmigrate?: string | undefined;
        skip?: string | undefined;
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
        destroy: z.ZodOptional<z.ZodBoolean>;
        env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
            name: z.ZodString;
            url: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            url: string;
            name: string;
        }, {
            url: string;
            name: string;
        }>]>>;
        gcp_service_account: z.ZodOptional<z.ZodString>;
        gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
        gcs_bucket_name_tfmigrate_history: z.ZodOptional<z.ZodString>;
        runs_on: z.ZodOptional<z.ZodString>;
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
        target: z.ZodString;
        template_dir: z.ZodOptional<z.ZodString>;
        terraform_apply_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                name: string;
            }, {
                url: string;
                name: string;
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
            runs_on: z.ZodOptional<z.ZodString>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }>>;
        terraform_plan_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                name: string;
            }, {
                url: string;
                name: string;
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
            runs_on: z.ZodOptional<z.ZodString>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }>>;
        tfmigrate_apply_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                name: string;
            }, {
                url: string;
                name: string;
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
            runs_on: z.ZodOptional<z.ZodString>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }>>;
        tfmigrate_plan_config: z.ZodOptional<z.ZodObject<{
            aws_assume_role_arn: z.ZodOptional<z.ZodString>;
            gcp_service_account: z.ZodOptional<z.ZodString>;
            gcp_workload_identity_provider: z.ZodOptional<z.ZodString>;
            environment: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
                name: z.ZodString;
                url: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                url: string;
                name: string;
            }, {
                url: string;
                name: string;
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
            runs_on: z.ZodOptional<z.ZodString>;
            env: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, "strip", z.ZodTypeAny, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }, {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        }>>;
        working_directory: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        target: string;
        working_directory: string;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        runs_on?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        terraform_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
    }, {
        target: string;
        working_directory: string;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        runs_on?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        terraform_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
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
    update_related_pull_requests: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
    }, {
        enabled?: boolean | undefined;
    }>>;
    working_directory_file: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    plan_workflow_name: string;
    target_groups: {
        target: string;
        working_directory: string;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        runs_on?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        terraform_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
    }[];
    aqua?: {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    } | undefined;
    base_working_directory?: string | undefined;
    draft_pr?: boolean | undefined;
    drift_detection?: {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    } | undefined;
    env?: Record<string, string> | undefined;
    label_prefixes?: {
        target?: string | undefined;
        tfmigrate?: string | undefined;
        skip?: string | undefined;
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
    update_related_pull_requests?: {
        enabled?: boolean | undefined;
    } | undefined;
    working_directory_file?: string | undefined;
}, {
    plan_workflow_name: string;
    target_groups: {
        target: string;
        working_directory: string;
        aws_region?: string | undefined;
        aws_assume_role_arn?: string | undefined;
        destroy?: boolean | undefined;
        env?: Record<string, string> | undefined;
        environment?: string | {
            url: string;
            name: string;
        } | undefined;
        gcp_service_account?: string | undefined;
        gcp_workload_identity_provider?: string | undefined;
        gcs_bucket_name_tfmigrate_history?: string | undefined;
        runs_on?: string | undefined;
        secrets?: {
            env_name: string;
            secret_name: string;
        }[] | undefined;
        s3_bucket_name_tfmigrate_history?: string | undefined;
        template_dir?: string | undefined;
        terraform_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        terraform_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_apply_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
        tfmigrate_plan_config?: {
            aws_assume_role_arn?: string | undefined;
            gcp_service_account?: string | undefined;
            gcp_workload_identity_provider?: string | undefined;
            environment?: string | {
                url: string;
                name: string;
            } | undefined;
            secrets?: {
                env_name: string;
                secret_name: string;
            }[] | undefined;
            runs_on?: string | undefined;
            env?: Record<string, string> | undefined;
        } | undefined;
    }[];
    aqua?: {
        update_checksum?: {
            enabled?: boolean | undefined;
            skip_push?: boolean | undefined;
            prune?: boolean | undefined;
        } | undefined;
    } | undefined;
    base_working_directory?: string | undefined;
    draft_pr?: boolean | undefined;
    drift_detection?: {
        issue_repo_owner?: string | undefined;
        issue_repo_name?: string | undefined;
        num_of_issues?: number | undefined;
        minimum_detection_interval?: number | undefined;
    } | undefined;
    env?: Record<string, string> | undefined;
    label_prefixes?: {
        target?: string | undefined;
        tfmigrate?: string | undefined;
        skip?: string | undefined;
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
    update_related_pull_requests?: {
        enabled?: boolean | undefined;
    } | undefined;
    working_directory_file?: string | undefined;
}>;
export type Config = z.infer<typeof Config>;
export declare const getConfig: () => Config;
export declare const getTarget: () => string;
export declare const getIsApply: () => boolean;
export declare const setValue: (name: string, value: string | undefined, defaultValue: string) => void;
export declare const getTargetFromTargetGroups: (targetGroups: Array<TargetConfig>, target: string) => TargetConfig | undefined;
export declare const getTargetFromTargetGroupsByWorkingDir: (targetGroups: Array<TargetConfig>, wd: string) => TargetConfig | undefined;
export declare const readTargetConfig: (p: string) => TargetConfig;
export declare const getJobType: () => string;
export declare const getJobConfig: (config: TargetConfig | undefined, isApply: boolean, jobType: string) => JobConfig | undefined;
export declare const setValues: (name: string, values: Array<any>) => void;
export declare const setOutputs: (keys: Array<string>, objs: Array<any>) => void;
type HasEnv = {
    env?: Record<string, string>;
};
export declare const setEnvs: (...objs: Array<HasEnv | undefined>) => void;
export {};