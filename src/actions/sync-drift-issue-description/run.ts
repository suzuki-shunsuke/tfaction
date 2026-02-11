export type Comment = {
  created_at: string;
  html_url: string;
  body: string;
};

export type RunInput = {
  issueNumber: number;
  comment: Comment;
  owner: string;
  repo: string;
  octokit: {
    rest: {
      issues: {
        update: (params: {
          owner: string;
          repo: string;
          issue_number: number;
          body: string;
        }) => Promise<unknown>;
      };
    };
  };
};

export const buildBody = (comment: Comment): string => {
  return `This issue was created by [tfaction](https://suzuki-shunsuke.github.io/tfaction/docs/).

About this issue, please see [the document](https://suzuki-shunsuke.github.io/tfaction/docs/feature/drift-detection).

## Latest comment

[${comment.created_at}](${comment.html_url})

${comment.body}
`;
};

export const run = async (input: RunInput): Promise<void> => {
  const body = buildBody(input.comment);
  await input.octokit.rest.issues.update({
    owner: input.owner,
    repo: input.repo,
    issue_number: input.issueNumber,
    body: body,
  });
};
