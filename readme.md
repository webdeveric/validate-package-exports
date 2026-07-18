# validate-package-exports

[![Node.js CI](https://github.com/webdeveric/validate-package-exports/actions/workflows/node.js.yml/badge.svg)](https://github.com/webdeveric/validate-package-exports/actions/workflows/node.js.yml)

Validate your `package.json` exports actually exist, have valid syntax, and can be imported or required without issues.

## Install

```shell
pnpm add validate-package-exports -D
```

```shell
npm i validate-package-exports -D
```

```shell
yarn add validate-package-exports -D
```

## Options

| Flag | Description | Default value |
| --- | --- | --- |
| `--concurrency` / `-c` | How many tasks to do at the same time | `availableParallelism()` |
| `--dev-condition` | Specify which custom conditions are used only during development | none |
| `--bail` / `-b` | Stop processing at the first error.<br>Enabled by default when `CI=true` | `process.env.CI === 'true'` |
| `--no-bail` | Turn off `--bail` | `false` |
| `--check` / `-s` | Check syntax of JS files | `false` |
| `--reporter` | Reporter to use for output | `text` |
| `--verbose` | Use verbose output | `false` |
| `--info` / `-i` | Show `info` messages.<br>Enabled by default when `RUNNER_DEBUG=1` | `process.env.RUNNER_DEBUG === '1'` |
| `--no-info` | Turn off `--info` | `false` |
| `--version` / `-v` | Print the version number | `false` |
| `--help` / `-h` | Show the help screen | `false` |

### Reporters

| Reporter | Description |
| --- | --- |
| `text` | Human-readable output with icons and colors. This is the default. |
| `json` | A single JSON array containing all results. |
| `ndjson` | [Newline-delimited JSON](http://ndjson.org/). Each result is written as its own JSON object as soon as it's available. |
| `sarif` | [SARIF](https://sarifweb.azurewebsites.net/) 2.1.0 output, useful for integrating with tools like GitHub code scanning. |

## Usage

```sh
validate-package-exports [FILE]... [options]
```

:information_source: If you do not provide a path to a `package.json`, it will try to find one in the current directory.

### Package scripts examples

```json
{
  "scripts": {
    "build": "YOUR-BUILD-SCRIPT",
    "postbuild": "validate-package-exports --check"
  }
}
```

OR

```json
{
  "scripts": {
    "prepublishOnly": "validate-package-exports --check"
  }
}
```

#### Dev Condition

If you use a [`customCondition` in your `tsconfig.json`](https://www.typescriptlang.org/tsconfig/#customConditions), like when using [Nx](https://nx.dev/docs/technologies/test-tools/vitest/guides/testing-without-building-dependencies#step-1-add-customconditions-to-tsconfigbasejson), you can use the `--dev-condition` flag so that those entry points are skipped when validating which files are packed.

```json
{
  "scripts": {
    "prepublishOnly": "validate-package-exports --check --info --dev-condition @example/monorepo"
  }
}
```

### Using `npx`

```shell
npx --yes validate-package-exports ./path/to/package.json --check
```

## Local development

```
fnm use
corepack enable
pnpm install
pnpm build
```

### Use local build

Run in separate tabs.

```sh
pnpm build -w
```

```sh
./dist/cli.mjs [FILE]... [OPTIONS]
```

#### Validate all packages in `node_modules`

This example demonstrates how you can bulk validate packages by piping in the `package.json` paths (one per line).

```sh
find -L ./node_modules -type d -name '.*' -prune -o \
  -type f -regex '.*/node_modules/\(@[^/]+/\)?[^/]+/package\.json' -print | ./dist/cli.mjs
```
