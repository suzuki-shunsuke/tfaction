import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import * as lib from './lib';

interface TargetConfig {
  target: string
  runs_on: string
  environment: string | object | null
  secrets: object | undefined
}

function getTargetConfigByTarget(targets: Array<lib.TargetConfig>, target: string, isApply: boolean, jobType: string): TargetConfig {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!target.startsWith(t.target)) {
      continue;
    }
    const jobConfig = lib.getJobConfig(t, isApply, jobType);
    if (jobConfig == undefined) {
      return {
        target: target,
        runs_on: t.runs_on ? t.runs_on : 'ubuntu-latest',
        environment: t.environment ? t.environment : null,
        secrets: t.secrets,
      };
    }
    return {
      target: target,
      runs_on: jobConfig.runs_on ? jobConfig.runs_on : (t.runs_on ? t.runs_on : 'ubuntu-latest'),
      environment: jobConfig.environment ? jobConfig.environment : (t.environment ? t.environment : null),
      secrets: jobConfig.secrets ? jobConfig.secrets : t.secrets,
    };
  }
  throw 'target is invalid';
}

function getPRBody(): string {
  if (github.context.payload.pull_request) {
    return github.context.payload.pull_request.body ? github.context.payload.pull_request.body : '';
  }
  const prPath = core.getInput('pull_request');
  if (!prPath) {
    return '';
  }
  const pr = JSON.parse(fs.readFileSync(prPath, 'utf8'));
  if (!pr || !pr.body) {
    return '';
  }
  return pr.body;
}

try {
  const config = lib.getConfig();

  const isApply = lib.getIsApply();

  const configWorkingDirMap = new Map();
  const configTargetMap = new Map();
  for (let i = 0; i < config.target_groups.length; i++) {
    const target = config.target_groups[i];
    configWorkingDirMap.set(target.working_directory, target);
    configTargetMap.set(target.target, target);
  }

  const labels = fs.readFileSync(core.getInput('labels'), 'utf8').split('\n');
  const changedFiles = fs.readFileSync(core.getInput('changed_files'), 'utf8').split('\n');
  const configFiles = fs.readFileSync(core.getInput('config_files'), 'utf8').split('\n');
  const workingDirs = new Set<string>();
  for (let i = 0; i < configFiles.length; i++) {
    const configFile = configFiles[i];
    if (configFile == '') {
      continue;
    }
    workingDirs.add(path.dirname(configFile));
  }

  // <!-- tfaction follow up pr target=foo -->
  let followupTarget = '';
  const followupPRBodyPrefix='<!-- tfaction follow up pr target=';
  const prBody = getPRBody();
  if (prBody.startsWith(followupPRBodyPrefix)) {
    followupTarget = prBody.split('\n')[0].slice(followupPRBodyPrefix.length, - ' -->'.length);
  }

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const skips = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  const targetPrefix = (config.label_prefixes != undefined && config.label_prefixes.target != undefined && config.label_prefixes.target != '') ?
    config.label_prefixes.target : 'target:';
  const skipPrefix = (config.label_prefixes != undefined && config.label_prefixes.skip != undefined && config.label_prefixes.skip != '') ?
    config.label_prefixes.skip : 'skip:';
  const tfmigratePrefix = (config.label_prefixes != undefined && config.label_prefixes.tfmigrate != undefined && config.label_prefixes.tfmigrate != '') ?
    config.label_prefixes.tfmigrate : 'tfmigrate:';

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label == '') {
      continue;
    }
    if (label.startsWith(targetPrefix)) {
      const target = label.slice(targetPrefix.length);
      if (!terraformTargets.has(target)) {
        terraformTargets.add(target);
        terraformTargetObjs.push(getTargetConfigByTarget(config.target_groups, target, isApply, 'terraform'));
      }
      continue;
    }
    if (label.startsWith(tfmigratePrefix)) {
      const target = label.slice(tfmigratePrefix.length);
      if (!tfmigrates.has(target)) {
        tfmigrates.add(target);
        tfmigrateObjs.push(getTargetConfigByTarget(config.target_groups, target, isApply, 'tfmigrate'));
      }
      continue;
    }
    if (label.startsWith(skipPrefix)) {
      skips.add(label.slice(skipPrefix.length));
      continue;
    }
  }

  const changedWorkingDirs = new Set<string>();
  for (let i = 0; i < changedFiles.length; i++) {
    const changedFile = changedFiles[i];
    if (changedFile == '') {
      continue;
    }
    for (let workingDir of workingDirs) {
      if (changedFile.startsWith(workingDir + '/')) {
        changedWorkingDirs.add(workingDir);
      }
    }
  }

  for (let changedWorkingDir of changedWorkingDirs) {
    for (let i = 0; i < config.target_groups.length; i++) {
      const target = config.target_groups[i];
      if (changedWorkingDir.startsWith(target.working_directory)) {
        const changedTarget = changedWorkingDir.replace(target.working_directory, target.target);
        if (!terraformTargets.has(changedTarget) && !tfmigrates.has(changedTarget)) {
          terraformTargets.add(changedTarget);
          terraformTargetObjs.push(getTargetConfigByTarget(config.target_groups, changedTarget, isApply, 'terraform'));
        }
        break;
      }
    }
  }

  if (followupTarget && !tfmigrates.has(followupTarget) && !terraformTargets.has(followupTarget)) {
    terraformTargets.add(followupTarget);
    terraformTargetObjs.push(getTargetConfigByTarget(config.target_groups, followupTarget, isApply, 'terraform'));
  }

  core.setOutput('tfmigrate_targets', tfmigrateObjs);
  core.setOutput('terraform_targets', terraformTargetObjs);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
