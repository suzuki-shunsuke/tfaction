import * as path from "path";
import { z } from "zod";

// .runs[].results[].locations[].physicalLocation.artifactLocation.uri
const SarifOutput = z.object({
  runs: z
    .object({
      results: z
        .object({
          locations: z
            .object({
              physicalLocation: z.object({
                artifactLocation: z.object({
                  uri: z.string(),
                }),
              }),
            })
            .array()
            .optional(),
        })
        .array(),
    })
    .array(),
});
type SarifOutput = z.infer<typeof SarifOutput>;

/**
 *
 * @param out SARIF format string
 * @param workingDir A relative path from the git root directory to the working directory
 */
export const listFiles = (out: string, workingDir: string): Set<string> => {
  const outJSON = SarifOutput.parse(JSON.parse(out));
  const files = new Set<string>();
  for (const run of outJSON.runs) {
    for (const result of run.results) {
      if (!result.locations) {
        continue;
      }
      for (const location of result.locations) {
        files.add(
          path.relative(
            workingDir,
            location.physicalLocation.artifactLocation.uri,
          ),
        );
      }
    }
  }
  return files;
};
