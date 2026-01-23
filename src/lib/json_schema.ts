import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { RawConfig, TargetConfig } from "./types";

export const generateJSONSchema = (dir: string) => {
  const configJSONSchema = z.toJSONSchema(RawConfig);
  fs.writeFileSync(
    path.join(dir, "tfaction-root.json"),
    JSON.stringify(configJSONSchema, null, 2),
  );

  const targetConfigJSONSchema = z.toJSONSchema(TargetConfig);
  fs.writeFileSync(
    path.join(dir, "tfaction.json"),
    JSON.stringify(targetConfigJSONSchema, null, 2),
  );
};
