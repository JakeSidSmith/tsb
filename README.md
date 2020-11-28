# @jakesidsmith/tsb

**Dead simple TypeScript bundler, watcher, dev server, transpiler, and polyfiller**

## About

### Introduction

The goal of this project is to create a TypeScript bundler that as closely matches the official TypeScript compiler as possible, utilizing as much config from your `tsconfig.json` as possible, with only minimal additional config required.

This library is basically just a wrapper around [webpack](https://webpack.js.org/) with a sensible set of default plugins and configuration for TypeScript projects.

If you later want more customization you should use webpack itself (or another bundler of your choice).

### Features

Out of the box tsb offers you:

- A production `build` command
- A development `watch` command
- A development `serve` command
- Transpiling (with [ts-loader](https://github.com/TypeStrong/ts-loader))
- Browser support/polyfilling (with [babel](https://babeljs.io/))
- Type checking in a separate thread (with [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin))
- Code minification/mangling, offering smaller builds
- Dead code elimination
- Expose [environment variables](#environment-variables) and define defaults (with [webpack environment plugin](https://webpack.js.org/plugins/environment-plugin/))
- Load environment variables from a `.env` file (with [dotenv](https://github.com/motdotla/dotenv))
- Hot-reloading
- [React hot-reloading](#react-hot-loading) (with [react-hot-loader](https://github.com/gaearon/react-hot-loader))
- Bundle hashing
- Code splitting
- SPA-style `index.html` serving and history API fallback

## Important things to consider

- You must set `"sourceMap": true` in your `tsconfig.json` to output source maps
- You must choose an ES module for the `tsconfig.json` `"module"` option e.g. `"ESNext"` ([why?](#why-es-modules))
- You should include `"tsb.config.ts"` in your `tsconfig.json` `"include"` option to ensure this is type checked
- You must install compatible React dependencies to enable [React hot-loading](#react-hot-loading)

## Install

```shell
npm i @jakesidsmith/tsb -P
```

`-P` is short for `--save-prod` and will add this to your `package.json` as a production dependency.

## Commands

```shell
# Bundle TypeScript files (production)
tsb build
# Watch TypeScript files and bundle them when changed (development)
tsb watch
# Run a dev server and update on change (development)
tsb serve
```

## Config

### CLI

By default tsb will look for a `tsb.config.ts` in the root directory of your project.

You can specify where to look for your config file with the `--config` CLI option e.g.

```shell
tsb build --config custom/location/tsb.config.ts
```

By default tsb will look for a `tsconfig.json` in the root of your project, but you can override this with the `tsconfigPath` option in your `tsb.config.ts`.

### Config options

#### Basic example

Your (minimal) config is defined in a `tsb.config.ts` e.g.

For a project with the structure:

```
/build/
  # Javascript is output here
/src/
  app.tsx
  index.tsx
tsb.config.ts
tsconfig.json
```

```ts
import { Config } from '../src';

const config: Config = {
  main: 'src/index.tsx,
  outDir: 'build',
};

export default config;
```

#### More complex/custom project example

For a more complex project with the following structure:

```
/build/
  # index.html is output here
  # /js/
    # JavaScript is output here
/src/
  /ts/
    app.tsx
    index.tsx
  index.html
  tsb.config.ts
  tsconfig.json
/public/
  /css/
    styles.css
```

```ts
import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.tsx,
  outDir: 'build',
  mainOutSubDir: 'js',
  indexHTML: 'src/index.html',
  tsconfigPath: 'src/tsconfig.json',
  publicDir: 'public',
  publicPath: '/public/'
};

export default config;
```

And then run this with:

```shell
tsb <command> --config src/tsb.config.ts
```

#### Environment variables

You must manually specify environment variables that you'd like to include in your bundle. This is a safety precaution to avoid including sensitive information.

These are defined as an object where the keys are the variable names, and the values are default values e.g.

```ts
const config: Config = {
  // ...
  env: {
    FALL_BACK_TO_DEFAULT: 'hello',
    ERROR_IF_NOT_PROVIDED_BY_THE_ENVIRONMENT: undefined,
  },
};
```

If any variables are resolved to `undefined` during a build (both defined as `undefined` in your config and not exposed by your environment) then the build will error.

### All config options

```ts
interface Config {
  // Required
  main: string;
  outDir: string;
  // Base options
  mainOutSubDir?: string;
  tsconfigPath?: string; // Default: tsconfig.json in the root of the project
  indexHTMLPath?: string;
  outputIndexHTMLFor?: readonly ('build' | 'watch' | 'serve')[]; // Default: ['build', 'watch']
  reactHotLoading?: boolean; // Default: true
  hashFilesFor?: readonly ('build' | 'watch' | 'serve')[]; // Default: ['build', 'watch']
  additionalFilesToParse?: readonly string[];
  env?: Record<string, any>;
  // Dev server options
  hotReload?: boolean; // Default: true
  host?: string; // Default: '0.0.0.0'
  port?: number; // Default: 8080
  publicDir?: string;
  publicPath?: string;
  singlePageApp?: boolean; // Default: true
  headers: Record<string, string>;
}
```

## Code splitting

In order to split your bundle, you should use dynamic imports at the locations where you'd like the modules to be split.

You can name the output bundles by supplying a comment e.g.

```
import(/* webpackChunkName: "my-file" */ './path/to/file');
```

You can also set chunks to be pre-loaded.

More info here: https://webpack.js.org/guides/code-splitting/

## React hot-loading

React hot-loading is enabled by default. To disable this set the `reactHotLoading` option to `false`.

In order for hot-loading to work correctly you should install the relevant (matching) versions of the following libraries:

```
react
react-dom
@hot-loader/react-dom
```

You will also need to mark your root component as hot-exported:

```tsx
import { hot } from 'react-hot-loader/root';

const App = () => <div>Hello World!</div>;

export default hot(App);
```

More info here: https://github.com/gaearon/react-hot-loader

## Dev server

By default the dev server will create an `index.html` file for you and serve this.

If you have a custom `index.html` file, or need this to be processed by another templating engine you can specify a location for this in the `indexHTMLPath` config option.

## Why ES modules?

You must choose an ES module for the `tsconfig.json` `"module"` option e.g. `"ESNext"`.

This is to improve build performance and better handle dead code elimination.

Don't worry, we'll still output browser friendly bundles that use [CommonJS](https://en.wikipedia.org/wiki/CommonJS).
