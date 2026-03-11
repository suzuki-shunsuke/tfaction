import { describe, it, expect } from "vitest";
import { listFiles } from "./sarif";

describe("listFiles", () => {
  const makeSarif = (
    runs: { results: { locations?: { uri: string }[] }[] }[],
  ): string =>
    JSON.stringify({
      runs: runs.map((run) => ({
        results: run.results.map((result) => ({
          locations: result.locations?.map((loc) => ({
            physicalLocation: {
              artifactLocation: { uri: loc.uri },
            },
          })),
        })),
      })),
    });

  it("returns empty set when there are no results", () => {
    const out = makeSarif([{ results: [] }]);
    expect(listFiles(out, "work")).toEqual(new Set());
  });

  it("returns empty set when there are no runs", () => {
    const out = makeSarif([]);
    expect(listFiles(out, "work")).toEqual(new Set());
  });

  it("extracts a single file", () => {
    const out = makeSarif([{ results: [{ locations: [{ uri: "main.tf" }] }] }]);
    expect(listFiles(out, "work")).toEqual(new Set(["work/main.tf"]));
  });

  it("extracts multiple files from multiple results", () => {
    const out = makeSarif([
      {
        results: [
          { locations: [{ uri: "main.tf" }] },
          { locations: [{ uri: "variables.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(
      new Set(["work/main.tf", "work/variables.tf"]),
    );
  });

  it("extracts files from multiple runs", () => {
    const out = makeSarif([
      { results: [{ locations: [{ uri: "a.tf" }] }] },
      { results: [{ locations: [{ uri: "b.tf" }] }] },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["work/a.tf", "work/b.tf"]));
  });

  it("extracts multiple files from multiple locations in a single result", () => {
    const out = makeSarif([
      {
        results: [
          {
            locations: [{ uri: "main.tf" }, { uri: "outputs.tf" }],
          },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(
      new Set(["work/main.tf", "work/outputs.tf"]),
    );
  });

  it("deduplicates files", () => {
    const out = makeSarif([
      {
        results: [
          { locations: [{ uri: "main.tf" }] },
          { locations: [{ uri: "main.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["work/main.tf"]));
  });

  it("skips results without locations", () => {
    const out = makeSarif([
      {
        results: [
          { locations: undefined },
          { locations: [{ uri: "main.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["work/main.tf"]));
  });

  it("computes relative path from workingDir", () => {
    const out = makeSarif([
      {
        results: [{ locations: [{ uri: "main.tf" }] }],
      },
    ]);
    expect(listFiles(out, "env/dev")).toEqual(new Set(["env/dev/main.tf"]));
  });

  it("handles empty workingDir", () => {
    const out = makeSarif([{ results: [{ locations: [{ uri: "main.tf" }] }] }]);
    expect(listFiles(out, "")).toEqual(new Set(["main.tf"]));
  });

  it("throws on invalid JSON", () => {
    expect(() => listFiles("not json", "work")).toThrow();
  });

  it("throws on invalid SARIF schema", () => {
    expect(() =>
      listFiles(JSON.stringify({ invalid: true }), "work"),
    ).toThrow();
  });
});
