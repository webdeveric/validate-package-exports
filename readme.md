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
| `--check` / `-s` | Check syntax of JS files | `false` |
| `--verify` / `-v` | Verify a module can be imported or required | `false` |
| `--concurrency` / `-c` | Concurrency | `availableParallelism()` |
| `--bail` / `-b` | Stop after the first error | `process.env.CI === 'true'` |
| `--no-bail` | Turn off `--bail` | `false` |
| `--info` / `-i` | Show `info` messages.<br>The default behavior is to only show `error`. | `process.env.RUNNER_DEBUG === '1'` |
| `--no-info` | Turn off `--info` | `false` |
| `--json` / `-j` | Use JSON output | `false` |

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
    "postbuild": "validate-package-exports --check --verify"
  }
}
```

OR

```json
{
  "scripts": {
    "prepublishOnly": "validate-package-exports --check --verify"
  }
}
```

### Using `npx`

```shell
npx --yes validate-package-exports ./path/to/package.json --check --verify
```

## Local development

```
fnm use
corepack enable
pnpm install
pnpm build
```
