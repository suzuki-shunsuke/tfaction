# Contributing

Please read the following document.

- https://github.com/suzuki-shunsuke/oss-contribution-guide

## Requirements

- [aqua](https://aquaproj.github.io/): CLI Version Manager
  - [cmdx](https://github.com/suzuki-shunsuke/cmdx): Task Runner
- Node.js

Install cmdx by aqua.

```sh
aqua i -l
```

After you update code, you have to run the following things.

- Build TypeScript: `npm run build`
- Test TypeScript: `npm t`
- Lint TypeScript: `npx eslint`
- Format code: `npm run fmt`
- [Update Document](website)

## Node.js version management

This project depends on Node.js, and there are a lot of Node.js version managers.
This project supports a lot of Node.js version managers.

- [aqua](https://aquaproj.github.io/): [aqua/node.yaml](aqua/node.yaml)
- [NVM](https://github.com/nvm-sh/nvm): [.nvmrc](.nvmrc)
- [.node-version](.node-version): https://github.com/shadowspawn/node-version-usage
  - asdf, mise, fnm, nodeenv, etc
- [volta](https://volta.sh/): [package.json](package.json)

These versions must be same.

## Node.js package manager

We manage Node.js packages using npm, not [yarn](https://yarnpkg.com/) and [pnpm](https://pnpm.io/).

## `dist` directories aren't committed

[#1913](https://github.com/suzuki-shunsuke/tfaction/pull/1913)

We don't manage transpiled JavaScript files in the main branch and feature branches anymore.

## Manual test

We provide some automatic tests such as unit tests, but sometimes the automatic tests aren't enough so you have to test your changes on your environment.
You have to build GitHub Actions workflows with tfaction and test your changes on the workflows.

When a pull request is created or updated, the branch `pr/<pull request number>` is also created or updated by GitHub Actions.

- https://github.com/suzuki-shunsuke/tfaction/actions/workflows/create-pr-branch.yaml
- https://github.com/suzuki-shunsuke/tfaction/blob/main/.github/workflows/create-pr-branch.yaml

> [!WARNING]
> These branches aren't created and updated against pull requests from fork repositories.
> Maintainers have to run [the workflow](https://github.com/suzuki-shunsuke/tfaction/actions/workflows/create-pr-branch.yaml) manually.

You can test your pull request version by `pr/<pull request number>`.

For example, if you want to test the pull request [#3402](https://github.com/suzuki-shunsuke/tfaction/pull/3402),
you can update tfaction's version of your workflows to `pr/3402`.

e.g.

```yaml
- uses: suzuki-shunsuke/tfaction@pr/3402
```

## Unit test

### index.ts / run.ts Pattern

For actions that need unit testing, separate code into two files:

- `index.ts` - Entry point that retrieves inputs (env vars, configs, GitHub context)
- `run.ts` - Business logic with typed parameters (no env/input access)

Example:

```typescript
// run.ts
export type RunInput = {
  jobType: JobType;
  isApply: boolean;
  config: Config;
  // ...
};

export const run = async (input: RunInput): Promise<RunResult> => {
  // Business logic here - no env/input access
};
```

```typescript
// index.ts
import { run } from "./run";
import * as lib from "../lib";

export const main = async () => {
  // Retrieve all inputs
  const jobType = lib.getJobType();
  const isApply = lib.getIsApply();
  const config = await lib.getConfig();

  // Pass to business logic
  const result = await run({ jobType, isApply, config });

  // Set outputs
  core.setOutput("result", result);
};
```

This separation allows `run.ts` to be tested by passing mock values directly, without complex mocking.

### env.ts and input.ts Usage

`src/lib/env.ts` and `src/lib/input.ts` are for environment variable access and input retrieval functions (e.g., `getJobType`, `getIsApply`, `getGitHubWorkspace`).
These files should only be referenced from action entry points (`src/*/index.ts`), not from `run.ts` or other business logic files.

`src/lib/index.ts` is for business logic utilities and config schemas. It does not depend on `env.ts`.

`env.ts` imports `JobType` from `index.ts` for validation. The dependency is one-way: `env.ts` → `index.ts`.

Note: `getConfig` is in `index.ts` because it depends on `RawConfig` schema defined there.

### Existing Examples

- `src/pick-out-drift-issues/` - Has `index.ts`, `run.ts`, and `run.test.ts`
- `src/plan/` - Has `index.ts` and `run.ts`
