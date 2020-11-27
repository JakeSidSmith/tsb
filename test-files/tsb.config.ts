import { Config } from '../src';

const config: Config = {
  bundle: {
    inFile: 'src/ts/index.ts',
    outDir: 'build/js/',
  },
  tsconfigPath: 'tsconfig.json',
  hashFiles: true,
  env: {
    TEST: undefined,
  },
};

export default config;
