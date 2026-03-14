import * as github from "@actions/github";
import type * as aqua from "../../aqua";
import { post } from "../../comment";

type AvailableProvider = { name: string };

export type CheckProvidersInput = {
  executor: aqua.Executor;
  tfCommand: string;
  workingDir: string;
  availableProviders: AvailableProvider[];
  target: string;
  githubToken: string;
  prNumber: number;
};

export const validateProviders = (
  providerSelections: Record<string, string>,
  availableProviders: AvailableProvider[],
): string[] => {
  const allowedNames = new Set(availableProviders.map((p) => p.name));
  return Object.keys(providerSelections).filter((p) => !allowedNames.has(p));
};

export const checkProviders = async (
  input: CheckProvidersInput,
): Promise<void> => {
  const result = await input.executor.getExecOutput(
    input.tfCommand,
    ["version", "-json"],
    { cwd: input.workingDir },
  );
  const versionInfo = JSON.parse(result.stdout);
  const providerSelections: Record<string, string> =
    versionInfo.provider_selections ?? {};
  const disallowed = validateProviders(
    providerSelections,
    input.availableProviders,
  );
  if (disallowed.length === 0) return;

  if (input.prNumber > 0) {
    const octokit = github.getOctokit(input.githubToken);
    await post({
      octokit,
      prNumber: input.prNumber,
      templateKey: "disallowed-provider",
      vars: {
        tfaction_target: input.target,
        disallowed_providers: disallowed,
      },
    });
  }
  throw new Error(`Disallowed providers: ${disallowed.join(", ")}`);
};
