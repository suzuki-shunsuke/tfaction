import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import * as lib from './lib';

try {
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
  const modules = new Set<string>();
  for (let i = 0; i < changedFiles.length; i++) {
    const changedFile = changedFiles[i];
    if (changedFile == '') {
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
