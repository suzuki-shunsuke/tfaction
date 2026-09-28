import { describe, it, expect, vi } from "vitest";
import {
  canonicalize,
  computePlanHash,
  maskSensitive,
  normalizePlan,
  resolveKMSRegion,
  sensitiveMask,
} from "./plan_hash";

const plan = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    format_version: "1.2",
    terraform_version: "1.14.0",
    timestamp: "2026-09-25T00:00:00Z",
    prior_state: { serial: 1, lineage: "abc" },
    resource_changes: [
      {
        address: "null_resource.b",
        type: "null_resource",
        change: {
          actions: ["create"],
          before: null,
          after: { triggers: { password: "secret", name: "b" } },
          after_unknown: { id: true },
          before_sensitive: false,
          after_sensitive: { triggers: { password: true } },
        },
      },
      {
        address: "null_resource.a",
        change: { actions: ["no-op"], before: {}, after: {} },
      },
    ],
    output_changes: {
      foo: { actions: ["update"], before: "x", after: "y" },
      bar: { actions: ["no-op"], before: "z", after: "z" },
    },
    ...overrides,
  });

const ctx = {
  target: "aws/foo",
  destroy: false,
  treeSHA: "tree-sha",
  lockFile: null,
};

const opts = {
  ...ctx,
  maskSensitive: true,
  method: "sha256",
};

describe("canonicalize", () => {
  it("sorts object keys and drops undefined", () => {
    expect(canonicalize({ b: 1, a: [2, { d: undefined, c: "x" }] })).toBe(
      '{"a":[2,{"c":"x"}],"b":1}',
    );
  });
});

describe("maskSensitive", () => {
  it("masks nested sensitive values", () => {
    expect(
      maskSensitive(
        { a: "x", b: ["y", "z"], c: { d: "w" } },
        { b: [false, true], c: true },
      ),
    ).toEqual({ a: "x", b: ["y", sensitiveMask], c: sensitiveMask });
  });
});

describe("normalizePlan", () => {
  it("ignores fields that change every run", () => {
    expect(normalizePlan(plan(), opts)).toBe(
      normalizePlan(
        plan({
          timestamp: "2026-09-26T00:00:00Z",
          terraform_version: "1.14.1",
          prior_state: { serial: 2, lineage: "abc" },
        }),
        opts,
      ),
    );
  });

  it("excludes no-op changes", () => {
    const normalized = normalizePlan(plan(), opts);
    expect(normalized).not.toContain("null_resource.a");
    expect(normalized).not.toContain('"bar"');
    expect(normalized).toContain("null_resource.b");
  });

  it("includes the provider", () => {
    const p = JSON.parse(plan());
    p.resource_changes[0].provider_name = "registry.terraform.io/evil/null";
    expect(normalizePlan(JSON.stringify(p), opts)).not.toBe(
      normalizePlan(plan(), opts),
    );
  });

  it("includes moved resources even if the action is no-op", () => {
    const normalized = normalizePlan(
      plan({
        resource_changes: [
          {
            address: "null_resource.new",
            previous_address: "null_resource.old",
            change: { actions: ["no-op"] },
          },
        ],
      }),
      opts,
    );
    expect(normalized).toContain("null_resource.new");
  });

  it("masks sensitive values", () => {
    expect(normalizePlan(plan(), opts)).not.toContain("secret");
    expect(normalizePlan(plan(), { ...opts, maskSensitive: false })).toContain(
      "secret",
    );
  });

  it("doesn't depend on the order of resource changes", () => {
    const p = JSON.parse(plan());
    const reversed = JSON.stringify({
      ...p,
      resource_changes: [...p.resource_changes].reverse(),
    });
    expect(normalizePlan(reversed, opts)).toBe(normalizePlan(plan(), opts));
  });
});

describe("computePlanHash", () => {
  it("returns the same hash for the same plan result", async () => {
    const h1 = await computePlanHash(plan(), { ...ctx });
    const h2 = await computePlanHash(plan({ timestamp: "x" }), { ...ctx });
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^v1:sha256:[0-9a-f]{64}$/);
  });

  it("returns a different hash if the context differs", async () => {
    const h = await computePlanHash(plan(), { ...ctx });
    expect(
      await computePlanHash(plan(), { ...ctx, treeSHA: "other" }),
    ).not.toBe(h);
    expect(
      await computePlanHash(plan(), { ...ctx, lockFile: "provider {}" }),
    ).not.toBe(h);
    expect(
      await computePlanHash(plan(), { ...ctx, target: "aws/bar" }),
    ).not.toBe(h);
    expect(await computePlanHash(plan(), { ...ctx, destroy: true })).not.toBe(
      h,
    );
  });

  it("ignores changes of only sensitive values without a key", async () => {
    const p = JSON.parse(plan());
    p.resource_changes[0].change.after.triggers.password = "other";
    expect(await computePlanHash(JSON.stringify(p), { ...ctx })).toBe(
      await computePlanHash(plan(), { ...ctx }),
    );
  });

  it("uses AWS KMS with a key and includes sensitive values", async () => {
    const mac = vi.fn((_key, digest: Buffer) =>
      Promise.resolve(digest.toString("hex")),
    );
    const key = { keyId: "alias/foo" };
    const p = JSON.parse(plan());
    p.resource_changes[0].change.after.triggers.password = "other";
    const h1 = await computePlanHash(plan(), { ...ctx, awsKMSKey: key }, mac);
    const h2 = await computePlanHash(
      JSON.stringify(p),
      { ...ctx, awsKMSKey: key },
      mac,
    );
    expect(mac).toHaveBeenCalledWith(key, expect.any(Buffer));
    expect(h1).toMatch(/^v1:hmac-sha256-aws-kms:/);
    expect(h1).not.toBe(h2);
  });
});

describe("resolveKMSRegion", () => {
  it("prefers the explicit region", () => {
    expect(
      resolveKMSRegion({
        keyId: "arn:aws:kms:us-east-1:123456789012:key/abc",
        region: "ap-northeast-1",
      }),
    ).toBe("ap-northeast-1");
  });

  it("gets the region from the key ARN", () => {
    expect(
      resolveKMSRegion({ keyId: "arn:aws:kms:us-east-1:123456789012:key/abc" }),
    ).toBe("us-east-1");
  });

  it("returns undefined for a key id", () => {
    expect(resolveKMSRegion({ keyId: "alias/foo" })).toBeUndefined();
  });
});
