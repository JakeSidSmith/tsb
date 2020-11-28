import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.tsx',
  outDir: 'build',
  mainOutSubDir: 'js',
  indexHTML: 'src/index.html',
  tsconfigPath: 'tsconfig.json',
  env: {
    TEST: undefined,
  },
  publicDir: 'static',
  publicPath: '/static/',
};

export default config;
