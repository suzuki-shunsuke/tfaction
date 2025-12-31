import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const main = async () => {
  const githubToken = core.getInput("github_token") || "";

  const installDir = path.join(__dirname, "install");
  const aquaConfig = path.join(installDir, "aqua", "aqua.yaml");
  const githubCommentConfig = path.join(installDir, "github-comment.yaml");

  // Output the config path
  core.setOutput("config", aquaConfig);

  // Run aqua i -l
  core.info(`Installing dependencies with aqua using config: ${aquaConfig}`);
  await exec.exec("aqua", ["i", "-l"], {
    env: {
      ...process.env,
      AQUA_CONFIG: aquaConfig,
      AQUA_GITHUB_TOKEN: githubToken,
    },
  });

  // Set environment variables for subsequent steps
  const existingAquaGlobalConfig = process.env.AQUA_GLOBAL_CONFIG || "";
  const newAquaGlobalConfig = existingAquaGlobalConfig
    ? `${aquaConfig}:${existingAquaGlobalConfig}`
    : aquaConfig;
  core.exportVariable("AQUA_GLOBAL_CONFIG", newAquaGlobalConfig);

  core.exportVariable("TFACTION_GITHUB_COMMENT_CONFIG", githubCommentConfig);
  core.exportVariable("TFACTION_INSTALL_DIR", installDir);

  core.info(`Set AQUA_GLOBAL_CONFIG=${newAquaGlobalConfig}`);
  core.info(`Set TFACTION_GITHUB_COMMENT_CONFIG=${githubCommentConfig}`);
  core.info(`Set TFACTION_INSTALL_DIR=${installDir}`);
};
