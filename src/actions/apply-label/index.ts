import * as input from "../../lib/input";
import { main as runApplyLabel } from "./run";

export const main = async () => {
  const prNumber = parseInt(input.prNumber, 10);
  if (Number.isNaN(prNumber)) {
    throw new Error(
      `pr_number is required and must be a valid integer, got: "${input.prNumber}"`,
    );
  }
  await runApplyLabel({
    githubToken: input.githubToken,
    prNumber,
    result: input.result,
  });
};
