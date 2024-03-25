# validate-package-exports

[![Node.js CI](https://github.com/webdeveric/validate-package-exports/actions/workflows/node.js.yml/badge.svg)](https://github.com/webdeveric/validate-package-exports/actions/workflows/node.js.yml)

## Install

```shell
npm i validate-package-exports -D
```

## Options

| Flag | Description | Default value | Required |
| --- | --- | --- | --- |
| `--package` / `-p` | Path to `package.json` file | `[cwd]/package.json` | :white_check_mark: |
| `--check` / `-s` | Check syntax of JS files | `false` |  |
| `--verify` / `-v` | Verify a module can be imported or required | `false` |  |
| `--concurrency` / `-c` | Concurrency | `availableParallelism()` |  |
| `--bail` / `-b` | Bail | `process.env.CI === 'true'` |  |
| `--logLevel` / `-l` | Log level | `info` |  |

## Recommended usage

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

## Local development

```
fnm use
corepack enable
pnpm install
pnpm build
```
