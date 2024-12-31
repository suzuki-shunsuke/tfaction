import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import { Octokit } from "@octokit/core";
import { paginateGraphQL } from "@octokit/plugin-paginate-graphql";
import * as lib from "../lib";
import * as path from "path";

type Inputs = {
    target?: string;
    workingDir?: string;
    ghToken: string;
    repo?: string;
};

type Result = {
    number: number;
    state: string;
    url: string;
};

type Issue = {
    url: string;
    number: number;
    state: string;
};

export const main = async () => {
    const cfg = lib.getConfig();
    if (!cfg.drift_detection) {
        // dirft detection is disabled
        return;
    }

    const result = await run({
        target: process.env.TFACTION_TARGET,
        workingDir: process.env.TFACTION_WORKING_DIR,
        ghToken: core.getInput("github_token", { required: true }),
        repo: process.env.GITHUB_REPOSITORY,
    });

    if (result === undefined) {
        return;
    }

    core.exportVariable("TFACTION_DRIFT_ISSUE_NUMBER", result.number);
    core.exportVariable("TFACTION_DRIFT_ISSUE_STATE", result.state);
    core.info(result.url);
    core.summary.addRaw(`Drift Issue: ${result.url}`, true);
};

const run = async (inputs: Inputs): Promise<Result | undefined> => {
    const cfg = lib.getConfig();
    if (!cfg.drift_detection) {
        core.info("drift detection is disabled");
        return undefined;
    }

    const repoOwner =
        cfg.drift_detection.issue_repo_owner ?? (inputs.repo ?? "").split("/")[0];
    const repoName =
        cfg.drift_detection.issue_repo_name ?? (inputs.repo ?? "").split("/")[1];
    if (!repoOwner || !repoName) {
        throw new Error("repo_owner and repo_name are required");
    }
    const tg = await lib.getTargetGroup(cfg, inputs.target, inputs.workingDir);
    const workingDirectoryFile = cfg.working_directory_file ?? "tfaction.yaml";

    const wdConfig = lib.readTargetConfig(
        path.join(tg.workingDir, workingDirectoryFile),
    );

    if (!checkEnabled(cfg, tg.group, wdConfig)) {
        core.info("drift detection is disabled");
        return;
    }
    core.info("drift detection is enabled");

    if (!inputs.ghToken) {
        throw new Error("GITHUB_TOKEN is required");
    }

    const MyOctokit = Octokit.plugin(paginateGraphQL);
    const octokit = new MyOctokit({ auth: inputs.ghToken });

    let issue = await getIssue(
        tg.target,
        inputs.ghToken,
        `${repoOwner}/${repoName}`,
    );
    if (issue === undefined) {
        core.info("creating a drift issue");
        issue = await lib.createIssue(
            tg.target,
            inputs.ghToken,
            repoOwner,
            repoName,
        );
    }

    return {
        number: issue.number,
        state: issue.state,
        url: issue.url,
    };
};

const getIssue = async (
    target: string,
    ghToken: string,
    repo: string,
): Promise<Issue | undefined> => {
    const MyOctokit = Octokit.plugin(paginateGraphQL);
    const octokit = new MyOctokit({ auth: ghToken });

    const title = `Terraform Drift (${target})`;
    const query = `query($cursor: String, $searchQuery: String!) {
  search(first: 100, after: $cursor, query: $searchQuery, type: ISSUE) {
    nodes {
    	... on Issue {
    		number
    		title
    		state
    		url
    	}
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

    const pageIterator = await octokit.graphql.paginate.iterator(query, {
        issuesCursor: null,
        searchQuery: `repo:${repo} "${title}" in:title`,
    });

    for await (const response of pageIterator) {
        for (const issue of response.search.nodes) {
            if (issue.title !== title) {
                continue;
            }
            return issue;
        }
    }
    return undefined;
};

const checkEnabled = (
    cfg: lib.Config,
    targetGroup: lib.TargetGroup,
    wdCfg: lib.TargetConfig,
): boolean => {
    if (wdCfg.drift_detection) {
        return wdCfg.drift_detection.enabled ?? true;
    }
    if (targetGroup.drift_detection) {
        return targetGroup.drift_detection.enabled ?? true;
    }
    return cfg.drift_detection?.enabled ?? false;
};
