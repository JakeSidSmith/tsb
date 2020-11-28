# @jakesidsmith/tsb

**Dead simple TypeScript bundler, watcher, dev server, transpiler, and polyfiller**

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

By default tsb will look for a `tsconfig.json` in the root of your project, but you can override this with the `tsconfig` option in your `tsb.config.ts`.

### Config options

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

### All config options

```ts
interface Config {
  // Required
  main: string;
  outDir: string;
  // Base options
  mainOutSubDir?: string;
  indexHTML?: string;
  outputIndexHTMLFor?: readonly ('build' | 'watch' | 'serve')[]; // Default: ['build', 'watch']
  reactHotLoading?: boolean; // Default: true
  tsconfigPath?: string; // Default: tsconfig.json in the root of the project
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

If you have a custom `index.html` file, or need this to be processed by another templating engine you can specify a location for this in the `indexHTML` config option.
