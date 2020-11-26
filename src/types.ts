export interface Config {
  bundle: {
    inFile: string;
    outDir: string;
    publicDir?: string;
  };
  indexHTML?: {
    inFile: string;
    outDir?: string;
    outputInDev?: boolean;
  };
  tsconfigPath?: string;
  port?: string;
  publicDir?: string;
  hashFiles?: boolean;
  hotReload?: boolean;
  additionalFilesToParse?: readonly string[];
  env?: Record<string, unknown>;
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
