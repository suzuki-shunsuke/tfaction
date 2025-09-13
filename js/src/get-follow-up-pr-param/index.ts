import * as core from "@actions/core";
import * as fs from "fs";
import { z } from "zod";

const PRData = z.object({
  body: z.string(),
  assignees: z
    .array(
      z.object({
        login: z.string(),
      }),
    )
    .optional(),
});

export const main = async () => {
  const prNumber = process.env.CI_INFO_PR_NUMBER;
  const target = process.env.TFACTION_TARGET;
  const branch = `follow-up-${prNumber}-${target}-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "")}`;
  const runURL = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const dir = process.env.WORKING_DIR;
  core.setOutput("branch", branch);
  core.setOutput(
    "commit_message",
    `chore: create a commit to open follow up pull request
Follow up #${prNumber}
${runURL}`,
  );
  core.setOutput("pr_title", `chore(${target}): follow up #${prNumber}`);
  let prBody = `This pull request was created automatically to follow up the failure of apply.
- Follow up #${prNumber} ([failed workflow](${runURL}))

Please write the description of this pull request below.

## Why did the terraform apply fail?

## How do you fix the problem?

`;
  core.setOutput("pr_body", prBody);

  const actor = process.env.GITHUB_ACTOR;
  const prAuthor = process.env.CI_INFO_PR_AUTHOR;
  const assignees = new Set<string>();
  if (prAuthor && !prAuthor.endsWith("[bot]")) {
    assignees.add(prAuthor);
  }
  if (actor && !actor.endsWith("[bot]") && actor !== prAuthor) {
    assignees.add(actor);
  }

  // Add assignees from the original PR
  const ciInfoTempDir = process.env.CI_INFO_TEMP_DIR;
  if (ciInfoTempDir) {
    const prJsonPath = `${ciInfoTempDir}/pr.json`;
    if (fs.existsSync(prJsonPath)) {
      try {
        const prDataRaw = JSON.parse(fs.readFileSync(prJsonPath, "utf8"));
        const prData = PRData.parse(prDataRaw);
        if (prData.assignees) {
          for (const assignee of prData.assignees) {
            assignees.add(assignee.login);
          }
        }
        prBody += `
---

<details>
<summary>Original PR description</summary>

${prData.body}

</details>
`;
      } catch (error) {
        console.error("Failed to read or parse pr.json:", error);
      }
    }
  }
  core.setOutput("assignees_txt", [...assignees].join("\n"));
  core.setOutput(
    "assignees_sh",
    [...assignees].map((a) => `-a ${a}`).join(" "),
  );
  core.setOutput("mentions", [...assignees].map((a) => `@${a}`).join(" "));

  if (!fs.existsSync(`${dir}/.tfaction`)) {
    fs.mkdirSync(`${dir}/.tfaction`);
  }
  if (!fs.existsSync(`${dir}/.tfaction/failed-prs`)) {
    fs.writeFileSync(
      `${dir}/.tfaction/failed-prs`,
      `# This file is created and updated by tfaction for follow up pull requests.
# You can remove this file safely.
`,
    );
  }
  fs.appendFileSync(
    `${dir}/.tfaction/failed-prs`,
    `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/pull/${process.env.CI_INFO_PR_NUMBER}
`,
  );
};
