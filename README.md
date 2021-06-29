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
- Hot-loading
- React hot-loading (with a little [extra setup](#react-hot-loading))
- Bundle hashing
- Code splitting
- SPA-style `index.html` serving and history API fallback

## Important things to consider

- You must set `"sourceMap": true` in your `tsconfig.json` to output source maps
- You must choose an ES module for the `tsconfig.json` `"module"` option e.g. `"ESNext"` ([why?](#why-es-modules))
- You should include `"tsb.config.ts"` in your `tsconfig.json` `"include"` option to ensure this is type checked (but we'll do that for you during a build anyway)
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

IMPORTANT: read the [important things to consider](#important-things-to-consider) before continuing.

### Basic example

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
import { Config } from '@jakesidsmith/tsb';

const config: Config = {
  main: 'src/index.tsx',
  outDir: 'build',
};

export default config;
```

### More complex/custom project example

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
  indexHTMLPath: 'src/index.html',
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

### Environment variables

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

### CLI

By default tsb will look for a `tsb.config.ts` in the root directory of your project.

You can specify where to look for your config file with the `--config` CLI option e.g.

```shell
tsb build --config custom/location/tsb.config.ts
```

By default tsb will look for a `tsconfig.json` in the root of your project, but you can override this with the `tsconfigPath` option in your `tsb.config.ts`.

### All config options

```ts
interface Config {
  // Required
  // Path to your TypeScript/JavaScript entry point
  main: string;
  // Path to the directory to output files
  outDir: string;
  // Base options
  // List of commands for which the outDir should be cleared before
  clearOutDirBefore?: readonly ('build' | 'watch' | 'serve')[]; // Default: []
  // Sub-directory to output JavaScript files within `outDir`
  mainOutSubDir?: string;
  // Name for the main bundle output
  mainBundleName?: string; // Default: 'bundle'
  // Path to tsconfig.json
  tsconfigPath?: string; // Default: tsconfig.json in the root of the project
  // Path to a custom index.html template
  indexHTMLPath?: string;
  // Variables to expose to the index.html template (referenced with <%= example %>)
  indexHTMLEnv?: Record<string, any>;
  // List of commands for which to output index.html to disk
  outputIndexHTMLFor?: readonly ('build' | 'watch' | 'serve')[]; // Default: ['build', 'watch']
  // Whether to add script tag to body, head, or not at all
  insertScriptTag?: 'body' | 'head' | false; // Default: 'body'
  // Whether React hot-loading is enabled
  reactHotLoading?: boolean; // Default: false
  // List of commands for which output bundles are hashed
  hashFilesFor?: readonly ('build' | 'watch' | 'serve')[]; // Default: ['build', 'watch']
  // List of paths/globs to files outside of your tsconfig.json includes that should be parsed
  additionalFilesToParse?: readonly string[];
  // Map of environment variables to include (key: variable name, value: default value (set undefined if  don't want a default))
  env?: Record<string, any>;
  // Dev server options
  // Whether hot-loading is enabled
  hotLoading?: boolean; // Default: true
  // Host of the dev server (e.g. '0.0.0.0' or 'localhost')
  host?: string; // Default: '0.0.0.0'
  // Port to run the dev server on
  port?: number; // Default: 8080
  // Path to the directory in which additional public/static files should be served from
  publicDir?: string;
  // Public path to refer to files stored in the `publicDir`
  publicPath?: string;
  // Whether to enable SPA-style index.html serving and history API fallback
  singlePageApp?: boolean; // Default: true
  // Custom headers to send with dev server requests
  headers?: Record<string, string>;
  // Extend the babel presets
  extendBabelPresets?: (
    presets: BabelPluginItem[],
    mode: Mode,
    command: Command
  ) => BabelPluginItem[];
  // Extend the babel plugins
  extendBabelPlugins?: (
    plugins: BabelPluginItem[],
    mode: Mode,
    command: Command
  ) => BabelPluginItem[];
  // Extend the webpack plugins
  extendWebpackPlugins?: (
    plugins: WebpackPlugin[],
    mode: Mode,
    command: Command
  ) => WebpackPlugin[];
  // Extend the webpack module.rules
  extendWebpackModuleRules?: (
    rules: WebpackModuleRule[],
    mode: Mode,
    command: Command
  ) => WebpackModuleRule[];
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

React hot-loading is disabled by default. To enable this set the `reactHotLoading` option to `true`.

In order for hot-loading to work correctly you must install `react-hot-loader`, and matching versions of the relevant react libraries - `react`, `react-dom`, and `@hot-loader/react-dom` e.g.

```shell
npm i react@17 react-dom@17 -P
# These are only needed in development so we'll use -D to add them as dev dependencies
npm i @hot-loader/react-dom@17 react-hot-loader -D
```

You will also need to mark your root component as hot-exported:

```tsx
import { hot } from 'react-hot-loader/root';

const App = () => <div>Hello World!</div>;

export default hot(App);
```

More info here: https://github.com/gaearon/react-hot-loader

React hot-loading is currently implemented with [react-hot-loader](https://github.com/gaearon/react-hot-loader) and only supports React <= 16. If you want to support React 17 you can use the experimental [@pmmmwh/react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin) with the `extendBabelPlugins` and `extendWebpackPlugins` options. You should not enable `reactHotLoading` if you are using `react-refresh`.

Example with `react-refresh`:

```ts
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';

const config: Config = {
  // ...base config...
  reactHotLoading: false,
  extendBabelPlugins: (plugins, mode, command) => {
    if (command === 'serve') {
      return [...plugins, require.resolve('react-refresh/babel')];
    }

    return plugins;
  },
  extendWebpackPlugins: (plugins, mode, command) => {
    if (command === 'serve') {
      return [...plugins, new ReactRefreshWebpackPlugin()];
    }

    return plugins;
  },
};
```

## Dev server

By default the dev server will create an `index.html` file for you and serve this.

If you have a custom `index.html` file, or need this to be processed by another templating engine you can specify a location for this in the `indexHTMLPath` config option.

## Why ES modules?

You must choose an ES module for the `tsconfig.json` `"module"` option e.g. `"ESNext"`.

This is to improve build performance and better handle dead code elimination.

Don't worry, we'll still output browser friendly bundles that use [CommonJS](https://en.wikipedia.org/wiki/CommonJS).
