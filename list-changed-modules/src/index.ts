import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

type Inputs = {
  changedFiles: string;
  configFiles: string;
};

try {
  const inputs = {
    changedFiles: core.getInput('changed_files', { required: true }),
    configFiles: core.getInput('config_files', { required: true }),
  };
  const changedFiles = fs.readFileSync(inputs.changedFiles, 'utf8').split('\n');
  const configFiles = fs.readFileSync(inputs.configFiles, 'utf8').split('\n');
  const workingDirs = new Set<string>();
  for (const configFile of configFiles) {
    if (configFile === '') {
      continue;
    }
    workingDirs.add(path.dirname(configFile));
  }
  const modules = new Set<string>();
  for (const changedFile of changedFiles) {
    if (changedFile === '') {
      continue;
    }
    for (let workingDir of workingDirs) {
      if (changedFile.startsWith(workingDir + '/')) {
        modules.add(workingDir);
      }
    }
  }

  core.info(`modules: ${Array.from(modules)}`);
  core.setOutput('modules', Array.from(modules));
} catch (error) {
  core.setFailed(error instanceof Error ? error.message : JSON.stringify(error));
}
