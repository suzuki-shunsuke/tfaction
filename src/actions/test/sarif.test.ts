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
    const out = makeSarif([
      { results: [{ locations: [{ uri: "work/main.tf" }] }] },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["main.tf"]));
  });

  it("extracts multiple files from multiple results", () => {
    const out = makeSarif([
      {
        results: [
          { locations: [{ uri: "work/main.tf" }] },
          { locations: [{ uri: "work/variables.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(
      new Set(["main.tf", "variables.tf"]),
    );
  });

  it("extracts files from multiple runs", () => {
    const out = makeSarif([
      { results: [{ locations: [{ uri: "work/a.tf" }] }] },
      { results: [{ locations: [{ uri: "work/b.tf" }] }] },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["a.tf", "b.tf"]));
  });

  it("extracts multiple files from multiple locations in a single result", () => {
    const out = makeSarif([
      {
        results: [
          {
            locations: [{ uri: "work/main.tf" }, { uri: "work/outputs.tf" }],
          },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["main.tf", "outputs.tf"]));
  });

  it("deduplicates files", () => {
    const out = makeSarif([
      {
        results: [
          { locations: [{ uri: "work/main.tf" }] },
          { locations: [{ uri: "work/main.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["main.tf"]));
  });

  it("skips results without locations", () => {
    const out = makeSarif([
      {
        results: [
          { locations: undefined },
          { locations: [{ uri: "work/main.tf" }] },
        ],
      },
    ]);
    expect(listFiles(out, "work")).toEqual(new Set(["main.tf"]));
  });

  it("computes relative path from workingDir", () => {
    const out = makeSarif([
      {
        results: [{ locations: [{ uri: "env/dev/main.tf" }] }],
      },
    ]);
    expect(listFiles(out, "env/dev")).toEqual(new Set(["main.tf"]));
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
