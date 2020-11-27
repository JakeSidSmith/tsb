import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.ts',
  outDir: 'build',
  mainOutSubDir: 'js',
  indexHTML: 'src/index.html',
  tsconfigPath: 'tsconfig.json',
  hashFiles: true,
  env: {
    TEST: undefined,
  },
  publicDir: 'static',
  publicPath: '/static/',
};

export default config;
