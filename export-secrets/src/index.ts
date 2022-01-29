import * as core from '@actions/core';
import * as lib from './lib';

interface TargetConfig {
  target: string
  secrets: Map<string, string>
}

function getTargetConfigByTarget(targets: Array<TargetConfig>, target: string): TargetConfig {
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (target.startsWith(t.target)) {
      return {
        target: target,
        secrets: t.secrets,
      };
    }
  }
  throw 'target is invalid';
}

try {
  const config = lib.getConfig();
  const secrets = JSON.parse(core.getInput('secrets')) as Map<string, string>;
  if (process.env.TFACTION_TARGET == undefined) {
    throw 'environment variable TFACTION_TARGET is required';
  }
  const target = getTargetConfigByTarget(config.targets, process.env.TFACTION_TARGET);
  for (let [envName, secretName] of target.secrets) {
    if (!secrets.has(secretName)) {
      throw `secret is not found: ${secretName}`;
    }
    const secretValue = secrets.get(secretName);
    core.exportVariable(envName, secretValue);
  }
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
