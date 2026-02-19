import { describe, it, expect } from "vitest";
import { evaluateWhen, renderExecTemplate } from "./exec";

describe("evaluateWhen", () => {
  it("returns true when ExitCode != 0 and exit code is 1", () => {
    expect(
      evaluateWhen("ExitCode != 0", {
        ExitCode: 1,
        Stdout: "",
        Stderr: "",
        CombinedOutput: "",
      }),
    ).toBe(true);
  });

  it("returns false when ExitCode != 0 and exit code is 0", () => {
    expect(
      evaluateWhen("ExitCode != 0", {
        ExitCode: 0,
        Stdout: "",
        Stderr: "",
        CombinedOutput: "",
      }),
    ).toBe(false);
  });

  it("returns true for literal true", () => {
    expect(
      evaluateWhen("true", {
        ExitCode: 0,
        Stdout: "",
        Stderr: "",
        CombinedOutput: "",
      }),
    ).toBe(true);
  });

  it("returns true when Stdout is empty", () => {
    expect(
      evaluateWhen('Stdout == ""', {
        ExitCode: 0,
        Stdout: "",
        Stderr: "",
        CombinedOutput: "",
      }),
    ).toBe(true);
  });

  it("returns false when Stdout is not empty", () => {
    expect(
      evaluateWhen('Stdout == ""', {
        ExitCode: 0,
        Stdout: "some output",
        Stderr: "",
        CombinedOutput: "some output",
      }),
    ).toBe(false);
  });

  it("evaluates CEL contains expression", () => {
    expect(
      evaluateWhen(
        'ExitCode != 0 && Stderr.contains("could not find any workflows named")',
        {
          ExitCode: 1,
          Stdout: "",
          Stderr: 'error: could not find any workflows named "test"',
          CombinedOutput: 'error: could not find any workflows named "test"',
        },
      ),
    ).toBe(true);
  });

  it("returns false when contains does not match", () => {
    expect(
      evaluateWhen(
        'ExitCode != 0 && Stderr.contains("could not find any workflows named")',
        {
          ExitCode: 1,
          Stdout: "",
          Stderr: "some other error",
          CombinedOutput: "some other error",
        },
      ),
    ).toBe(false);
  });

  it("returns false when ExitCode is 0 even if contains matches", () => {
    expect(
      evaluateWhen(
        'ExitCode != 0 && Stderr.contains("could not find any workflows named")',
        {
          ExitCode: 0,
          Stdout: "",
          Stderr: 'error: could not find any workflows named "test"',
          CombinedOutput: 'error: could not find any workflows named "test"',
        },
      ),
    ).toBe(false);
  });
});

describe("renderExecTemplate", () => {
  it("renders template with Vars", () => {
    const result = renderExecTemplate(":x: {{Vars.tfaction_target}}\n", {
      Vars: { tfaction_target: "aws/dev" },
      ExitCode: 1,
      Stdout: "",
      Stderr: "error",
      CombinedOutput: "error",
      Command: "terraform",
      JoinCommand: "terraform plan",
    });
    expect(result).toBe(":x: aws/dev\n");
  });

  it("renders template with ExitCode and CombinedOutput", () => {
    const result = renderExecTemplate(
      "exit={{ExitCode}} out={{CombinedOutput}}",
      {
        Vars: {},
        ExitCode: 1,
        Stdout: "out",
        Stderr: "err",
        CombinedOutput: "outerr",
        Command: "cmd",
        JoinCommand: "cmd arg",
      },
    );
    expect(result).toBe("exit=1 out=outerr");
  });
});
