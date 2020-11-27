import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.ts',
  outDir: 'build/',
  mainOutSubDir: 'js',
  indexHTML: 'src/index.html',
  tsconfigPath: 'tsconfig.json',
  hashFiles: true,
  env: {
    TEST: undefined,
  },
};

export default config;
