import * as github from "@actions/github";
import { evaluate } from "@marcbachmann/cel-js";

export type CommentMeta = {
  SHA1: string;
  Program: string;
  Command: string;
  JobName: string;
  PRNumber: number;
  Target: string;
  WorkflowName: string;
  Vars: Record<string, unknown>;
};

export type Logger = {
  info: (message: string) => void;
  debug: (message: string) => void;
};

export type RunInput = {
  octokit: ReturnType<typeof github.getOctokit>;
  repoOwner: string;
  repoName: string;
  prNumber: number;
  commitSHA: string;
  ifCondition: string;
  logger: Logger;
};

export type RunResult = {
  hiddenCount: number;
  totalCount: number;
};

type Comment = {
  id: string;
  body: string;
  isMinimized: boolean;
};

export const DEFAULT_CONDITION =
  'Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && !(Comment.Meta.Program == "tfcmt" && Comment.Meta.Command == "apply")';

const metaPattern = /<!-- github-comment: ({.*?}) -->/s;

export const parseCommentMeta = (body: string): CommentMeta | undefined => {
  const match = metaPattern.exec(body);
  if (!match) {
    return undefined;
  }
  try {
    return JSON.parse(match[1]) as CommentMeta;
  } catch {
    return undefined;
  }
};

export const buildCELContext = (
  meta: CommentMeta | undefined,
  commitSHA: string,
) => {
  if (meta) {
    return {
      Comment: {
        HasMeta: true,
        Meta: {
          SHA1: meta.SHA1,
          Program: meta.Program,
          Command: meta.Command,
          JobName: meta.JobName,
          PRNumber: meta.PRNumber,
          Target: meta.Target,
          WorkflowName: meta.WorkflowName,
          Vars: meta.Vars,
        },
      },
      Commit: { SHA1: commitSHA },
    };
  }
  return {
    Comment: {
      HasMeta: false,
      Meta: {
        SHA1: "",
        Program: "",
        Command: "",
        JobName: "",
        PRNumber: 0,
        Target: "",
        WorkflowName: "",
        Vars: {},
      },
    },
    Commit: { SHA1: commitSHA },
  };
};

export const listComments = async (
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<Comment[]> => {
  const query = `
    query($owner: String!, $name: String!, $prNumber: Int!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $prNumber) {
          comments(first: 100, after: $cursor) {
            nodes {
              id
              body
              isMinimized
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    }
  `;

  const comments: Comment[] = [];
  let cursor: string | null = null;

  while (true) {
    const result: {
      repository: {
        pullRequest: {
          comments: {
            nodes: Comment[];
            pageInfo: {
              endCursor: string;
              hasNextPage: boolean;
            };
          };
        };
      };
    } = await octokit.graphql(query, {
      owner,
      name: repo,
      prNumber,
      cursor,
    });

    const { nodes, pageInfo } = result.repository.pullRequest.comments;
    comments.push(...nodes);

    if (!pageInfo.hasNextPage) {
      break;
    }
    cursor = pageInfo.endCursor;
  }

  return comments;
};

export const minimizeComment = async (
  octokit: ReturnType<typeof github.getOctokit>,
  commentId: string,
): Promise<void> => {
  await octokit.graphql(
    `
    mutation($id: ID!) {
      minimizeComment(input: {subjectId: $id, classifier: OUTDATED}) {
        minimizedComment {
          isMinimized
        }
      }
    }
  `,
    { id: commentId },
  );
};

export const run = async (input: RunInput): Promise<RunResult> => {
  const {
    octokit,
    repoOwner,
    repoName,
    prNumber,
    commitSHA,
    ifCondition,
    logger,
  } = input;

  const comments = await listComments(octokit, repoOwner, repoName, prNumber);
  logger.info(`Found ${comments.length} comments on PR #${prNumber}`);

  let hiddenCount = 0;
  let totalCount = 0;

  for (const comment of comments) {
    if (comment.isMinimized) {
      continue;
    }
    totalCount++;

    const meta = parseCommentMeta(comment.body);
    const context = buildCELContext(meta, commitSHA);
    const result = evaluate(ifCondition, context);

    if (result) {
      logger.debug(`Hiding comment ${comment.id}`);
      await minimizeComment(octokit, comment.id);
      hiddenCount++;
    }
  }

  return { hiddenCount, totalCount };
};
