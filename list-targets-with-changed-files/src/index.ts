import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as lib from './lib';

interface TargetConfig {
  target: string
  runs_on: string
}

function getTargetConfigByTarget(targets: Array<TargetConfig>, target: string): TargetConfig {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (target.startsWith(t.target)) {
      return {
        target: target,
        runs_on: t.runs_on ? t.runs_on : 'ubuntu-latest',
      };
    }
  }
  throw 'target is invalid';
}

try {
  const config = lib.getConfig();

  const configWorkingDirMap = new Map();
  const configTargetMap = new Map();
  for (let i = 0; i < config.targets.length; i++) {
    const target = config.targets[i];
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

  const terraformTargets = new Set<string>();
  const tfmigrates = new Set<string>();
  const ignores = new Set<string>();
  const terraformTargetObjs = new Array<TargetConfig>();
  const tfmigrateObjs = new Array<TargetConfig>();

  const targetPrefix = (config.label_prefixes != undefined && config.label_prefixes.target != undefined && config.label_prefixes.target != '') ?
    config.label_prefixes.target : 'target:';
  const ignorePrefix = (config.label_prefixes != undefined && config.label_prefixes.ignore != undefined && config.label_prefixes.ignore != '') ?
    config.label_prefixes.ignore : 'ignore:';
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
        terraformTargetObjs.push(getTargetConfigByTarget(config.targets, target));
      }
      continue;
    }
    if (label.startsWith(tfmigratePrefix)) {
      const target = label.slice(tfmigratePrefix.length);
      if (!tfmigrates.has(target)) {
        tfmigrates.add(target);
        tfmigrateObjs.push(getTargetConfigByTarget(config.targets, target));
      }
      continue;
    }
    if (label.startsWith(ignorePrefix)) {
      ignores.add(label.slice(ignorePrefix.length));
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
    for (let i = 0; i < config.targets.length; i++) {
      const target = config.targets[i];
      if (changedWorkingDir.startsWith(target.working_directory)) {
        const changedTarget = changedWorkingDir.replace(target.working_directory, target.target);
        if (!terraformTargets.has(changedTarget) && !ignores.has(changedTarget) && !tfmigrates.has(changedTarget)) {
          terraformTargets.add(changedTarget);
          terraformTargetObjs.push(getTargetConfigByTarget(config.targets, changedTarget));
        }
        break;
      }
    }
  }
  core.setOutput('tfmigrate_targets', tfmigrateObjs);
  core.setOutput('terraform_targets', terraformTargetObjs);
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
