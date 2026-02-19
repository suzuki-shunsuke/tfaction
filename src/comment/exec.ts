import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as github from "@actions/github";
import Handlebars from "handlebars";
import { evaluate } from "@marcbachmann/cel-js";

import {
  type ExecTemplateEntry,
  loadConfig,
  registerHelpers,
  buildCommentBody,
  postComment,
} from "./index";
import type { Comment } from "../aqua/run";

export type ExecResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export const evaluateWhen = (
  when: string,
  context: {
    ExitCode: number;
    Stdout: string;
    Stderr: string;
    CombinedOutput: string;
  },
): boolean => {
  const result = evaluate(when, context);
  return !!result;
};

const findMatchingTemplate = (
  templates: ExecTemplateEntry[],
  context: {
    ExitCode: number;
    Stdout: string;
    Stderr: string;
    CombinedOutput: string;
  },
): ExecTemplateEntry | undefined => {
  for (const entry of templates) {
    if (evaluateWhen(entry.when, context)) {
      return entry;
    }
  }
  return undefined;
};

export const renderExecTemplate = (
  templateStr: string,
  context: {
    Vars: Record<string, string>;
    ExitCode: number;
    Stdout: string;
    Stderr: string;
    CombinedOutput: string;
    Command: string;
    JoinCommand: string;
  },
): string => {
  const template = Handlebars.compile(templateStr);
  return template(context);
};

const getPRNumber = (comment: Comment): number => {
  if (comment.pr) {
    return parseInt(comment.pr, 10);
  }
  return github.context.issue.number;
};

export const execAndComment = async (
  command: string,
  args: string[] | undefined,
  comment: Comment,
  execOptions?: exec.ExecOptions,
): Promise<ExecResult> => {
  let stdout = "";
  let stderr = "";
  let combinedOutput = "";

  const result = await exec.getExecOutput(command, args, {
    ...execOptions,
    ignoreReturnCode: true,
    listeners: {
      ...execOptions?.listeners,
      stdout: (data: Buffer) => {
        const str = data.toString();
        stdout += str;
        combinedOutput += str;
        execOptions?.listeners?.stdout?.(data);
      },
      stderr: (data: Buffer) => {
        const str = data.toString();
        stderr += str;
        combinedOutput += str;
        execOptions?.listeners?.stderr?.(data);
      },
    },
  });

  const exitCode = result.exitCode;

  const config = loadConfig();
  const key = comment.key ?? "default";
  const templates = config.exec[key] ?? config.exec["default"];
  if (!templates) {
    core.warning(`No exec comment templates found for key "${key}"`);
    if (exitCode !== 0) {
      throw new Error(
        `Command failed with exit code ${exitCode}: ${command} ${(args ?? []).join(" ")}`,
      );
    }
    return { exitCode, stdout, stderr };
  }

  const celContext = {
    ExitCode: exitCode,
    Stdout: stdout,
    Stderr: stderr,
    CombinedOutput: combinedOutput,
  };

  const match = findMatchingTemplate(templates, celContext);
  if (match) {
    registerHelpers();

    const joinCommand = [command, ...(args ?? [])].join(" ");
    const templateContext = {
      ...celContext,
      Vars: comment.vars ?? {},
      Command: command,
      JoinCommand: joinCommand,
    };

    const message = renderExecTemplate(match.template, templateContext);
    const templateKey = key;
    const body = buildCommentBody(message, templateKey, comment.vars ?? {});

    const octokit = github.getOctokit(comment.token);
    const prNumber = getPRNumber(comment);

    await postComment(octokit, prNumber, body, comment.org, comment.repo);
  }

  if (exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${exitCode}: ${command} ${(args ?? []).join(" ")}`,
    );
  }

  return { exitCode, stdout, stderr };
};
