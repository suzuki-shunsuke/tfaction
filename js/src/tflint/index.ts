import * as core from '@actions/core'
import { run } from './run'

export const main = async (): Promise<void> => {
  await run({
    workingDirectory: core.getInput('working_directory', { required: false }),
    githubToken: core.getInput('github_token', { required: true }),
    githubTokenForTflintInit: core.getInput('github_token_for_tflint_init', { required: false }),
    githubComment: core.getBooleanInput('github_comment', { required: true }),
    githubTokenForFix: core.getInput('github_token_for_fix', { required: false }),
    fix: core.getBooleanInput('fix', { required: true }),
    useSecurefixAction: core.getBooleanInput('use_securefix_action', { required: true }),
  })
};
