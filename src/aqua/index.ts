import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as tc from "@actions/tool-cache";
import { createHash } from "crypto";
import { chmod, readFile, rm } from "fs/promises";
import { join, dirname } from "path";
import { arch, homedir, platform, tmpdir } from "os";
import { mkdtempSync, existsSync, renameSync, mkdirSync } from "fs";
import * as lib from "../lib";
import * as env from "../lib/env";

const Version = "v2.56.2";
const CHECKSUMS = new Map([
  [
    "aqua_darwin_amd64.tar.gz",
    "46fb7060a3c94483ff3ea70e48b4bee3793d1d629ccec66050296ea57944af9c",
  ],
  [
    "aqua_darwin_arm64.tar.gz",
    "a93db5795ca73d878c8bae612cb08c67e0130b1c0926c995fd84fdde08ccc1aa",
  ],
  [
    "aqua_linux_amd64.tar.gz",
    "6ecff5d9f79ed31d3aeab826a15023dce577806a85b563d71975503418c2b34b",
  ],
  [
    "aqua_linux_arm64.tar.gz",
    "158c501f3aa5b97b54acfb3c8e8438cabb3f931929da8265c564badcf872e596",
  ],
  [
    "aqua_windows_amd64.zip",
    "fc3480ee1f43563a3703e853d5e659b2894b5c302ca27781f6c2bad3e337a9b6",
  ],
  [
    "aqua_windows_arm64.zip",
    "190e2450d4857c497b3bf37a1998c0bb155526da1eea2645f255590c6b0956df",
  ],
]);

const getOS = (): string => {
  const os = platform();
  switch (os) {
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    case "win32":
      return "windows";
    default:
      throw new Error(`Unsupported OS: ${os}`);
  }
};

const getArch = (): string => {
  const architecture = arch();
  switch (architecture) {
    case "x64":
      return "amd64";
    case "arm64":
      return "arm64";
    default:
      throw new Error(`Unsupported architecture: ${architecture}`);
  }
};

const getInstallPath = (os: string): string => {
  const aquaRoot = env.all.AQUA_ROOT_DIR;
  if (os === "windows") {
    const base =
      aquaRoot || join(homedir(), "AppData", "Local", "aquaproj-aqua");
    return join(base, "bin", "aqua.exe");
  } else {
    const xdgDataHomeVal =
      env.all.XDG_DATA_HOME || join(homedir(), ".local", "share");
    const base = aquaRoot || join(xdgDataHomeVal, "aquaproj-aqua");
    return join(base, "bin", "aqua");
  }
};

const downloadFile = async (url: string): Promise<string> => {
  core.info(`Downloading ${url} ...`);
  return await tc.downloadTool(url);
};

const verifyChecksum = async (
  filePath: string,
  expectedChecksum: string,
): Promise<void> => {
  core.info("Verifying checksum ...");

  const fileData = await readFile(filePath);
  const hash = createHash("sha256");
  hash.update(fileData);
  const hashHex = hash.digest("hex");

  if (hashHex !== expectedChecksum) {
    throw new Error(
      `Checksum verification failed. Expected: ${expectedChecksum}, Got: ${hashHex}`,
    );
  }
};

const extractArchive = async (
  archivePath: string,
  destDir: string,
  isWindows: boolean,
): Promise<string> => {
  if (isWindows) {
    return await tc.extractZip(archivePath, destDir);
  }
  return await tc.extractTar(archivePath, destDir);
};

export type ExecutorOptions = {
  githubToken?: string;
  cwd?: string;
};

export const NewExecutor = async (
  options: ExecutorOptions,
): Promise<Executor> => {
  const installDir = await install();
  const executor = new Executor(installDir, options.githubToken);
  core.startGroup("aqua i -l -a");
  await executor.exec("aqua", ["i", "-l", "-a"], {
    cwd: options.cwd,
  });
  core.endGroup();
  return executor;
};

export class Executor {
  installDir: string;
  githubToken?: string;
  constructor(installDir: string, githubToken?: string) {
    this.installDir = installDir;
    this.githubToken = githubToken;
  }
  async exec(
    command: string,
    args?: string[],
    options?: exec.ExecOptions,
  ): Promise<number> {
    return await exec.exec(command, args, {
      ...options,
      env: {
        ...process.env,
        ...options?.env,
        AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
        ...(this.githubToken && {
          AQUA_GITHUB_TOKEN: this.githubToken,
        }),
        ...(this.installDir && {
          PATH: `${env.all.PATH}:${this.installDir}`,
        }),
      },
    });
  }
  async getExecOutput(
    command: string,
    args?: string[],
    options?: exec.ExecOptions,
  ): Promise<exec.ExecOutput> {
    return await exec.getExecOutput(command, args, {
      ...options,
      env: {
        ...process.env,
        ...options?.env,
        AQUA_GLOBAL_CONFIG: lib.aquaGlobalConfig,
        ...(this.githubToken && {
          AQUA_GITHUB_TOKEN: this.githubToken,
        }),
        ...(this.installDir && {
          PATH: `${env.all.PATH}:${this.installDir}`,
        }),
      },
    });
  }
}

/**
 * install installs aqua.
 * It doesn't run commands like `aqua install` and `aqua policy allow`.
 * @returns The installation directory of aqua
 */
export const install = async (): Promise<string> => {
  try {
    await exec.exec("aqua", ["--version"], {
      silent: true,
    });
    core.info("Installing aqua is skipped");
    return "";
  } catch {
    // aqua is not installed, continue with installation
  }

  const os = getOS();
  const architecture = getArch();

  const installPath = getInstallPath(os);
  const installDir = dirname(installPath);
  core.addPath(installDir);

  if (existsSync(installPath)) {
    core.info(`aqua is already installed at ${installPath}`);
    await chmod(installPath, 0o755);
    return installDir;
  }

  core.info("installing aqua");
  const isWindows = os === "windows";
  const ext = isWindows ? "zip" : "tar.gz";
  const filename = `aqua_${os}_${architecture}.${ext}`;
  const url = `https://github.com/aquaproj/aqua/releases/download/${Version}/${filename}`;

  const expectedChecksum = CHECKSUMS.get(filename);
  if (!expectedChecksum) {
    throw new Error(`No checksum found for ${filename}`);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "aqua-"));
  try {
    const downloadPath = await downloadFile(url);
    await verifyChecksum(downloadPath, expectedChecksum);

    const extractedPath = await extractArchive(
      downloadPath,
      tempDir,
      isWindows,
    );

    const aquaBinaryPath = join(extractedPath, isWindows ? "aqua.exe" : "aqua");
    await chmod(aquaBinaryPath, 0o755);
    mkdirSync(installDir, { recursive: true });
    renameSync(aquaBinaryPath, installPath);
    return installDir;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

export const checkTerrgruntRun = async (
  executor: Executor,
  cwd: string | undefined,
): Promise<boolean> => {
  // https://github.com/suzuki-shunsuke/tfaction/issues/3148
  // terragrunt v0.88.0: Drop the support `terragrunt fmt`
  // terragrunt v0.73.0: support `terrgrunt run`
  const runCode = await executor.exec("terragrunt", ["run", "--help"], {
    cwd: cwd,
    silent: true,
    ignoreReturnCode: true,
  });
  return runCode === 0;
};
