import * as github from "@actions/github";
import * as input from "../lib/input";

export const main = async () => {
  const ghToken = input.getRequiredGitHubToken();
  const octokit = github.getOctokit(ghToken);

  const issueNumber = github.context.payload.issue?.number;
  if (!issueNumber) {
    throw new Error("issue number is required");
  }

  const comment = github.context.payload.comment;
  if (!comment) {
    throw new Error("comment is required");
  }

  const body = `This issue was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).

About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).

## Latest comment

[${comment.created_at}](${comment.html_url})

${comment.body}
`;

  await octokit.rest.issues.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issueNumber,
    body: body,
  });
};
