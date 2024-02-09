# Contributing

Please read the following document.

- https://github.com/suzuki-shunsuke/oss-contribution-guide

## Requirements

- [aqua](https://aquaproj.github.io/): CLI Version Manager
  - [cmdx](https://github.com/suzuki-shunsuke/cmdx): Task Runner
- Node.js
  - [prettier](https://prettier.io/): Formatter

Install cmdx by aqua.

```sh
aqua i -l
```

After you update code, you have to run the following things.

- Build TypeScript
- Test JavaScript Action
- Format code
- Update [JSON Schema](schema) and [document](https://suzuki-shunsuke.github.io/tfaction/docs/)

## Build TypeScript

```sh
npm run build
```

Build all JavaScript Actions.
If you update [lib](lib), you have to run this command.

```sh
cmdx build
```

## Test JavaScript Actions

```sh
npm t
```

## Format code

```sh
cmdx fmt
```

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

For example, if you want to test the pull request [#1513](https://github.com/suzuki-shunsuke/tfaction/pull/1513),
you can update tfaction's version of your workflows to `pr/1513`.

e.g.

```yaml
- uses: suzuki-shunsuke/tfaction/setup@pr/1513
```
