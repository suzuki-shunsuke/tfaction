import { describe, it, expect } from "vitest";
import { run, type DriftIssueRepo } from "./run";
import type { Config } from "../../lib/types";

// Helper to create a minimal valid config for testing
const createMinimalConfig = (
  overrides: Partial<Config> = {},
): Config => ({
  plan_workflow_name: "plan",
  working_directory_file: "tfaction.yaml",
  module_file: "tfaction_module.yaml",
  renovate_login: "renovate[bot]",
  draft_pr: false,
  skip_create_pr: false,
  terraform_command: "terraform",
  label_prefixes: {
    skip: "skip:",
    tfmigrate: "tfmigrate:",
  },
  tflint: {
    enabled: true,
    fix: false,
  },
  trivy: {
    enabled: true,
  },
  target_groups: [],
  git_root_dir: "/path/to/repo",
  config_path: "/path/to/repo/tfaction-root.yaml",
  config_dir: "/path/to/repo",
  workspace: "/path/to/repo",
  ...overrides,
});

const createDefaultDriftIssueRepo = (): DriftIssueRepo => ({
  owner: "test-owner",
  name: "test-repo",
});

describe("run", () => {
  describe("basic config values", () => {
    it("returns working_directory_file from config", () => {
      const config = createMinimalConfig({
        working_directory_file: "custom.yaml",
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.working_directory_file).toBe("custom.yaml");
    });

    it("returns module_file from config", () => {
      const config = createMinimalConfig({
        module_file: "custom_module.yaml",
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.module_file).toBe("custom_module.yaml");
    });

    it("returns renovate_login from config", () => {
      const config = createMinimalConfig({
        renovate_login: "my-renovate[bot]",
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.renovate_login).toBe("my-renovate[bot]");
    });

    it("returns draft_pr from config", () => {
      const config = createMinimalConfig({ draft_pr: true });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.draft_pr).toBe(true);
    });

    it("returns skip_create_pr from config", () => {
      const config = createMinimalConfig({ skip_create_pr: true });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.skip_create_pr).toBe(true);
    });

    it("returns plan_workflow_name from config", () => {
      const config = createMinimalConfig({
        plan_workflow_name: "custom-plan-workflow",
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.plan_workflow_name).toBe("custom-plan-workflow");
    });

    it("returns terraform_command from config", () => {
      const config = createMinimalConfig({
        terraform_command: "tofu",
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.terraform_command).toBe("tofu");
    });
  });

  describe("label prefixes", () => {
    it("returns label_prefix_tfmigrate from config", () => {
      const config = createMinimalConfig({
        label_prefixes: { skip: "skip:", tfmigrate: "migrate:" },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.label_prefix_tfmigrate).toBe("migrate:");
    });

    it("returns label_prefix_skip from config", () => {
      const config = createMinimalConfig({
        label_prefixes: { skip: "custom-skip:", tfmigrate: "tfmigrate:" },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.label_prefix_skip).toBe("custom-skip:");
    });
  });

  describe("drift issue repo", () => {
    it("returns drift_issue_repo_owner from driftIssueRepo", () => {
      const config = createMinimalConfig();
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: { owner: "custom-owner", name: "custom-repo" },
      });
      expect(result.drift_issue_repo_owner).toBe("custom-owner");
    });

    it("returns drift_issue_repo_name from driftIssueRepo", () => {
      const config = createMinimalConfig();
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: { owner: "custom-owner", name: "custom-repo" },
      });
      expect(result.drift_issue_repo_name).toBe("custom-repo");
    });
  });

  describe("update_related_pull_requests", () => {
    it("returns disable_update_related_pull_requests as false when enabled is true", () => {
      const config = createMinimalConfig({
        update_related_pull_requests: { enabled: true },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.disable_update_related_pull_requests).toBe(false);
    });

    it("returns disable_update_related_pull_requests as true when enabled is false", () => {
      const config = createMinimalConfig({
        update_related_pull_requests: { enabled: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.disable_update_related_pull_requests).toBe(true);
    });

    it("returns disable_update_related_pull_requests as false when not configured (defaults to enabled)", () => {
      const config = createMinimalConfig({
        update_related_pull_requests: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.disable_update_related_pull_requests).toBe(false);
    });
  });

  describe("update_local_path_module_caller", () => {
    it("returns true when enabled is true", () => {
      const config = createMinimalConfig({
        update_local_path_module_caller: { enabled: true },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.update_local_path_module_caller).toBe(true);
    });

    it("returns false when enabled is false", () => {
      const config = createMinimalConfig({
        update_local_path_module_caller: { enabled: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.update_local_path_module_caller).toBe(false);
    });

    it("returns false when not configured (default)", () => {
      const config = createMinimalConfig({
        update_local_path_module_caller: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.update_local_path_module_caller).toBe(false);
    });
  });

  describe("aqua update checksum", () => {
    it("returns aqua_update_checksum_enabled as true when enabled", () => {
      const config = createMinimalConfig({
        aqua: { update_checksum: { enabled: true } },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.aqua_update_checksum_enabled).toBe(true);
    });

    it("returns aqua_update_checksum_enabled as false when not configured", () => {
      const config = createMinimalConfig({ aqua: undefined });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.aqua_update_checksum_enabled).toBe(false);
    });

    it("returns aqua_update_checksum_prune as true when enabled", () => {
      const config = createMinimalConfig({
        aqua: { update_checksum: { prune: true } },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.aqua_update_checksum_prune).toBe(true);
    });

    it("returns aqua_update_checksum_prune as false when not configured", () => {
      const config = createMinimalConfig({ aqua: undefined });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.aqua_update_checksum_prune).toBe(false);
    });

    describe("aqua_update_checksum_skip_push", () => {
      it("returns true when driftIssueNumber is set (regardless of config)", () => {
        const config = createMinimalConfig({
          aqua: { update_checksum: { skip_push: false } },
        });
        const result = run({
          config,
          driftIssueNumber: "123",
          driftIssueRepo: createDefaultDriftIssueRepo(),
        });
        expect(result.aqua_update_checksum_skip_push).toBe(true);
      });

      it("returns true when driftIssueNumber is set and config is undefined", () => {
        const config = createMinimalConfig({ aqua: undefined });
        const result = run({
          config,
          driftIssueNumber: "456",
          driftIssueRepo: createDefaultDriftIssueRepo(),
        });
        expect(result.aqua_update_checksum_skip_push).toBe(true);
      });

      it("returns config value when driftIssueNumber is undefined", () => {
        const config = createMinimalConfig({
          aqua: { update_checksum: { skip_push: true } },
        });
        const result = run({
          config,
          driftIssueNumber: undefined,
          driftIssueRepo: createDefaultDriftIssueRepo(),
        });
        expect(result.aqua_update_checksum_skip_push).toBe(true);
      });

      it("returns false when driftIssueNumber is undefined and config is not set", () => {
        const config = createMinimalConfig({ aqua: undefined });
        const result = run({
          config,
          driftIssueNumber: undefined,
          driftIssueRepo: createDefaultDriftIssueRepo(),
        });
        expect(result.aqua_update_checksum_skip_push).toBe(false);
      });
    });
  });

  describe("tflint", () => {
    it("returns enable_tflint as true when enabled is true", () => {
      const config = createMinimalConfig({
        tflint: { enabled: true, fix: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_tflint).toBe(true);
    });

    it("returns enable_tflint as false when enabled is false", () => {
      const config = createMinimalConfig({
        tflint: { enabled: false, fix: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_tflint).toBe(false);
    });

    it("returns enable_tflint as true by default", () => {
      // With undefined tflint, it should default to true
      const config = createMinimalConfig();
      // Directly override tflint to undefined to test the default
      (config as { tflint?: { enabled?: boolean; fix?: boolean } }).tflint =
        undefined;
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_tflint).toBe(true);
    });

    it("returns tflint_fix as true when fix is true", () => {
      const config = createMinimalConfig({
        tflint: { enabled: true, fix: true },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.tflint_fix).toBe(true);
    });

    it("returns tflint_fix as false when fix is false", () => {
      const config = createMinimalConfig({
        tflint: { enabled: true, fix: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.tflint_fix).toBe(false);
    });

    it("returns tflint_fix as false by default", () => {
      const config = createMinimalConfig();
      (config as { tflint?: { enabled?: boolean; fix?: boolean } }).tflint =
        undefined;
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.tflint_fix).toBe(false);
    });
  });

  describe("trivy", () => {
    it("returns enable_trivy as true when enabled is true", () => {
      const config = createMinimalConfig({
        trivy: { enabled: true },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_trivy).toBe(true);
    });

    it("returns enable_trivy as false when enabled is false", () => {
      const config = createMinimalConfig({
        trivy: { enabled: false },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_trivy).toBe(false);
    });

    it("returns enable_trivy as true by default", () => {
      const config = createMinimalConfig();
      (config as { trivy?: { enabled?: boolean } }).trivy = undefined;
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.enable_trivy).toBe(true);
    });
  });

  describe("follow_up_pr group label", () => {
    it("returns custom prefix when configured", () => {
      const config = createMinimalConfig({
        follow_up_pr: {
          group_label: {
            prefix: "custom-prefix/",
            enabled: true,
          },
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.follow_up_pr_group_label_prefix).toBe("custom-prefix/");
    });

    it("returns default prefix when not configured", () => {
      const config = createMinimalConfig({
        follow_up_pr: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.follow_up_pr_group_label_prefix).toBe(
        "tfaction:follow-up-pr-group/",
      );
    });

    it("returns enabled as true when configured", () => {
      const config = createMinimalConfig({
        follow_up_pr: {
          group_label: {
            enabled: true,
          },
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.follow_up_pr_group_label_enabled).toBe(true);
    });

    it("returns enabled as false when not configured", () => {
      const config = createMinimalConfig({
        follow_up_pr: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.follow_up_pr_group_label_enabled).toBe(false);
    });
  });

  describe("securefix_action", () => {
    it("returns server_repository when configured", () => {
      const config = createMinimalConfig({
        securefix_action: {
          server_repository: "org/server-repo",
          pull_request: {
            base_branch: "main",
          },
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.securefix_action_server_repository).toBe("org/server-repo");
    });

    it("returns empty string for server_repository when not configured", () => {
      const config = createMinimalConfig({
        securefix_action: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.securefix_action_server_repository).toBe("");
    });

    it("returns pull_request base_branch when configured", () => {
      const config = createMinimalConfig({
        securefix_action: {
          server_repository: "org/server-repo",
          pull_request: {
            base_branch: "develop",
          },
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.securefix_action_pull_request_base_branch).toBe("develop");
    });

    it("returns empty string for base_branch when not configured", () => {
      const config = createMinimalConfig({
        securefix_action: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.securefix_action_pull_request_base_branch).toBe("");
    });
  });

  describe("limit_changed_dirs", () => {
    it("returns max_changed_working_dirs when configured", () => {
      const config = createMinimalConfig({
        limit_changed_dirs: {
          working_dirs: 10,
          modules: 5,
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.max_changed_working_dirs).toBe(10);
    });

    it("returns 0 for max_changed_working_dirs when not configured", () => {
      const config = createMinimalConfig({
        limit_changed_dirs: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.max_changed_working_dirs).toBe(0);
    });

    it("returns max_changed_modules when configured", () => {
      const config = createMinimalConfig({
        limit_changed_dirs: {
          working_dirs: 10,
          modules: 15,
        },
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.max_changed_modules).toBe(15);
    });

    it("returns 0 for max_changed_modules when not configured", () => {
      const config = createMinimalConfig({
        limit_changed_dirs: undefined,
      });
      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: createDefaultDriftIssueRepo(),
      });
      expect(result.max_changed_modules).toBe(0);
    });
  });

  describe("complete config scenario", () => {
    it("returns all values correctly for a fully configured config", () => {
      const config = createMinimalConfig({
        working_directory_file: "custom-wd.yaml",
        module_file: "custom-mod.yaml",
        renovate_login: "renovate-bot",
        draft_pr: true,
        skip_create_pr: true,
        plan_workflow_name: "terraform-plan",
        terraform_command: "tofu",
        label_prefixes: {
          skip: "do-not-run:",
          tfmigrate: "migrate-tf:",
        },
        update_related_pull_requests: { enabled: false },
        update_local_path_module_caller: { enabled: true },
        aqua: {
          update_checksum: {
            enabled: true,
            prune: true,
            skip_push: true,
          },
        },
        tflint: { enabled: false, fix: true },
        trivy: { enabled: false },
        follow_up_pr: {
          group_label: {
            enabled: true,
            prefix: "follow-up/",
          },
        },
        securefix_action: {
          server_repository: "my-org/secure-server",
          pull_request: { base_branch: "main" },
        },
        limit_changed_dirs: {
          working_dirs: 20,
          modules: 30,
        },
      });

      const result = run({
        config,
        driftIssueNumber: undefined,
        driftIssueRepo: { owner: "my-org", name: "my-repo" },
      });

      expect(result).toEqual({
        working_directory_file: "custom-wd.yaml",
        module_file: "custom-mod.yaml",
        renovate_login: "renovate-bot",
        draft_pr: true,
        skip_create_pr: true,
        plan_workflow_name: "terraform-plan",
        label_prefix_tfmigrate: "migrate-tf:",
        label_prefix_skip: "do-not-run:",
        drift_issue_repo_owner: "my-org",
        drift_issue_repo_name: "my-repo",
        disable_update_related_pull_requests: true,
        update_local_path_module_caller: true,
        aqua_update_checksum_enabled: true,
        aqua_update_checksum_prune: true,
        aqua_update_checksum_skip_push: true,
        enable_tflint: false,
        enable_trivy: false,
        tflint_fix: true,
        terraform_command: "tofu",
        follow_up_pr_group_label_prefix: "follow-up/",
        follow_up_pr_group_label_enabled: true,
        securefix_action_server_repository: "my-org/secure-server",
        securefix_action_pull_request_base_branch: "main",
        max_changed_working_dirs: 20,
        max_changed_modules: 30,
      });
    });
  });
});
