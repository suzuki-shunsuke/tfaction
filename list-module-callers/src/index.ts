import * as core from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";
import {buildModuleToCallers, resolveRelativeCallTree} from "./lib";

function getGoBin(): string {
    const gobin = child_process.execSync(`go env GOBIN`).toString("utf-8").trim();
    if (gobin !== "") {
        return gobin;
    }
    const gopath = child_process.execSync(`go env GOPATH`).toString("utf-8").trim();
    if (gopath !== "") {
        return `${gopath}/bin`;
    }
    // Fallback to the default path if GOBIN or GOPATH are both unset.
    return "/home/runner/go/bin";
}

try {
    const configFiles = fs
        .readFileSync(core.getInput("config_files"), "utf8")
        .split("\n");
    const moduleFiles = fs
        .readFileSync(core.getInput("module_files"), "utf8")
        .split("\n");

    const rawModuleCalls: Record<string, Array<string>> = {};

    const allTerraformFiles = Array.from([...configFiles, ...moduleFiles]);
    allTerraformFiles.forEach(tfFile => {
        if (tfFile == "") {
            return;
        }

        const tfDir = path.dirname(tfFile);
        const inspection = JSON.parse(child_process.execSync(`${getGoBin()}/terraform-config-inspect --json ${tfDir}`).toString("utf-8"));

        // List keys of Local Path modules (source starts with ./ or ../) in module_calls
        rawModuleCalls[tfDir] = Object.values(inspection["module_calls"]).flatMap((module: any) => {
            const source = module.source;
            if (source.startsWith("./") || source.startsWith("../")) {
                return [source]
            } else {
                return []
            }
        });
    });

    const moduleCallers = buildModuleToCallers(resolveRelativeCallTree(rawModuleCalls));
    const json = JSON.stringify(moduleCallers);
    core.info(`file: ${json}`);
    core.setOutput("file", json);
} catch (error) {
    core.setFailed(
        error instanceof Error ? error.message : JSON.stringify(error),
    );
}
