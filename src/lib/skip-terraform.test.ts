import { describe, expect, it } from "vitest";

import { warnSkipTerraform } from "./skip-terraform";

describe("warnSkipTerraform", () => {
  it("tells the user to gate the plan step", () => {
    const msg = warnSkipTerraform("plan");
    expect(msg).toContain("TFACTION_SKIP_TERRAFORM is true");
    expect(msg).toContain("action: plan");
    expect(msg).toContain("if: matrix.target.skip_terraform != true");
  });

  it("tells the user to gate the apply step", () => {
    const msg = warnSkipTerraform("apply");
    expect(msg).toContain("action: apply");
    expect(msg).toContain(
      "https://suzuki-shunsuke.github.io/tfaction/docs/skip-terraform",
    );
  });
});
