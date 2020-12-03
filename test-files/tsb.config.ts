import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.tsx',
  outDir: 'build',
  mainOutSubDir: 'js',
  mainBundleName: 'index',
  indexHTMLPath: 'src/index.html',
  tsconfigPath: 'tsconfig.json',
  env: {
    TEST: undefined,
  },
  publicDir: 'static',
  publicPath: '/static/',
  reactHotLoading: true,
};

export default config;
