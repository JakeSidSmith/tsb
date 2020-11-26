export interface Config {
  bundle: {
    inFile: string;
    outDir: string;
  };
  indexHTML?: {
    inFile: string;
    outDir?: string;
  };
  tsconfigPath?: string;
  port?: string;
  publicDir?: string;
  hashFiles?: boolean;
  additionalFilesToParse?: readonly string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env?: Record<string, any>;
}

export type Mode = 'development' | 'production';

export type JSX =
  | 'preserve'
  | 'react'
  | 'react-jsx'
  | 'react-jsxdev'
  | 'react-native';

export interface Tsconfig {
  include: readonly string[];
  extends?: string;
  compilerOptions?: {
    jsx?: JSX;
    sourceMap?: boolean;
    module?: string;
  };
}
