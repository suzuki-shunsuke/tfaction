import * as core from "@actions/core";
import * as githubAppToken from "@suzuki-shunsuke/github-app-token";

const tokens: githubAppToken.Token[] = [];

export const createToken = async (opts: {
  appId: string;
  privateKey: string;
  owner: string;
  repositories: string[];
  permissions: githubAppToken.Permissions;
}): Promise<string> => {
  const appToken = await githubAppToken.create(opts);
  core.setSecret(appToken.token);
  tokens.push(appToken);
  return appToken.token;
};

export const revokeAll = async (): Promise<void> => {
  for (const token of tokens) {
    if (githubAppToken.hasExpired(token.expiresAt)) {
      core.info("skip revoking GitHub App token as it has already expired");
      continue;
    }
    core.info("revoking GitHub App token");
    await githubAppToken.revoke(token.token);
  }
};
