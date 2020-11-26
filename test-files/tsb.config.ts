import * as path from 'path';
import { Config } from '../src';

const config: Config = {
  bundle: {
    inFile: path.resolve(process.cwd(), 'test-files/src/index.ts'),
    outDir: path.resolve(process.cwd(), 'test-files/build/'),
  },
  tsconfigPath: path.resolve(process.cwd(), 'test-files/tsconfig.json'),
  hashFiles: false,
  env: {
    TEST: undefined,
  },
};

export default config;
