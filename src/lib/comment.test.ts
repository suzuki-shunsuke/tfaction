import { describe, it, expect } from "vitest";
import { parseCommentMeta, buildCELContext } from "./comment";

describe("parseCommentMeta", () => {
  it("extracts valid metadata from comment body", () => {
    const body = `some text
<!-- github-comment: {"SHA1":"abc123","Program":"tfcmt","Command":"plan","JobName":"plan","PRNumber":42,"Target":"aws/dev","WorkflowName":"ci","Vars":{}} -->
more text`;
    const meta = parseCommentMeta(body);
    expect(meta).toEqual({
      SHA1: "abc123",
      Program: "tfcmt",
      Command: "plan",
      JobName: "plan",
      PRNumber: 42,
      Target: "aws/dev",
      WorkflowName: "ci",
      Vars: {},
    });
  });

  it("returns undefined for comment without metadata", () => {
    const body = "This is a plain comment with no metadata";
    expect(parseCommentMeta(body)).toBeUndefined();
  });

  it("returns undefined for invalid JSON", () => {
    const body = "<!-- github-comment: {invalid json} -->";
    expect(parseCommentMeta(body)).toBeUndefined();
  });
});

describe("buildCELContext", () => {
  it("builds correct context with metadata", () => {
    const meta = {
      SHA1: "abc123",
      Program: "tfcmt",
      Command: "plan",
      JobName: "plan-job",
      PRNumber: 42,
      Target: "aws/dev",
      WorkflowName: "ci",
      Vars: { key: "value" },
    };
    const context = buildCELContext(meta, "def456");
    expect(context).toEqual({
      Comment: {
        HasMeta: true,
        Meta: {
          SHA1: "abc123",
          Program: "tfcmt",
          Command: "plan",
          JobName: "plan-job",
          PRNumber: 42,
          Target: "aws/dev",
          WorkflowName: "ci",
          Vars: { key: "value" },
        },
      },
      Commit: { SHA1: "def456" },
    });
  });

  it("builds context with defaults when no metadata", () => {
    const context = buildCELContext(undefined, "def456");
    expect(context).toEqual({
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
      Commit: { SHA1: "def456" },
    });
  });
});
