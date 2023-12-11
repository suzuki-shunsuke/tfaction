import * as core from '@actions/core';
import * as lib from 'lib';

try {
  const config = lib.getConfig();
  lib.setValue('base_working_directory', config.base_working_directory, '.');
  lib.setValue('working_directory_file', config.working_directory_file, 'tfaction.yaml');

  lib.setValue('module_base_directory', config.module_base_directory, '.');
  lib.setValue('module_file', config.module_file, 'tfaction_module.yaml');

  lib.setValue('renovate_login', config.renovate_login, 'renovate[bot]');
  core.setOutput('draft_pr', config.draft_pr ? true : false);
  core.setOutput('skip_create_pr', config.skip_create_pr ? true : false);

  if (config.label_prefixes != undefined) {
    lib.setValue('label_prefix_target', config.label_prefixes.target, 'target:');
    lib.setValue('label_prefix_tfmigrate', config.label_prefixes.tfmigrate, 'tfmigrate:');
    lib.setValue('label_prefix_skip', config.label_prefixes.skip, 'skip:');
  } else {
    core.setOutput('label_prefix_target', 'target:');
    core.setOutput('label_prefix_tfmigrate', 'tfmigrate:');
    core.setOutput('label_prefix_skip', 'skip:');
  }

  if (config.drift_detection && config.drift_detection.issue_repo_owner) {
    core.setOutput('drift_issue_repo_owner', config.drift_detection.issue_repo_owner);
  } else {
    if (process.env.GITHUB_REPOSITORY) {
      core.setOutput('drift_issue_repo_owner', process.env.GITHUB_REPOSITORY.split('/')[0]);
    }
  }

  if (config.drift_detection && config.drift_detection.issue_repo_name) {
    core.setOutput('drift_issue_repo_name', config.drift_detection.issue_repo_name);
  } else {
    if (process.env.GITHUB_REPOSITORY) {
      const a = process.env.GITHUB_REPOSITORY.split('/');
      if (a.length > 1) {
        core.setOutput('drift_issue_repo_name', a[1]);
      }
    }
  }

  core.setOutput('disable_update_related_pull_requests', config?.update_related_pull_requests?.enabled ? 'false' : 'true');
  core.exportVariable('TFACTION_SKIP_ADDING_AQUA_PACKAGES', config?.scaffold_working_directory?.skip_adding_aqua_packages ?? 'true');

  core.setOutput('aqua_update_checksum_enabled', config?.aqua?.update_checksum?.enabled ?? 'false');

  if (process.env.TFACTION_DRIFT_ISSUE_NUMBER) {
    core.setOutput('aqua_update_checksum_skip_push', 'true');
  } else {
    core.setOutput('aqua_update_checksum_skip_push', config?.aqua?.update_checksum?.skip_push ?? 'false');
  }

  core.setOutput('aqua_update_checksum_prune', config?.aqua?.update_checksum?.prune ?? 'false');

  core.setOutput('enable_tfsec', config?.tfsec?.enabled ?? 'false');
  core.setOutput('enable_tflint', config?.tflint?.enabled ?? 'true');
  core.setOutput('enable_trivy', config?.trivy?.enabled ?? 'true');

  if (!config.plan_workflow_name) {
    throw 'The setting "plan_workflow_name" is required in tfaction-root.yaml';
  }
  core.setOutput('plan_workflow_name', config.plan_workflow_name);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
