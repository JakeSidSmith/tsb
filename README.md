# @jakesidsmith/tsb

**Dead simple TypeScript bundler, watcher, dev server, transpiler, and polyfiller**

## Install

```shell
npm i @jakesidsmith/tsb -P
```

`-P` is short for `--save-prop` and will add this to your `package.json` as a production dependency.

## Commands

```shell
# Run a full production build
tsb build
# Watch files for changes and re-compile (development)
tsb watch
# Start a dev server that watches for changes and automatically updates (development)
tsb server
```

## Config

Your (minimal) config is defined in a `tsb.config.ts` e.g.

```ts
import { Config } from '../src';

const config: Config = {
  bundle: {
    inFile: 'src/index.tsx,
    outDir: 'build',
  },
};

export default config;
```

You can specify where to look for your config file with the `--config` CLI option e.g.

```shell
tsb build --config custom/location/tsb.config.ts
```

You can see what config options are available in the `Config` type, but the only ones that are required are those shown above.

By default tsb will look for a `tsconfig.json` in the root of your project, but you can override this with the `tsconfig` option in your `tsb.config.ts`.
