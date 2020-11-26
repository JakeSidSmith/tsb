export interface Config {
  // Required
  bundle: {
    inFile: string;
    outDir: string;
    publicDir?: string;
  };
  // Base options
  indexHTML?: {
    inFile: string;
    outDir?: string;
    outputInDev?: boolean;
  };
  tsconfigPath?: string;
  hashFiles?: boolean;
  hashFilesInDev?: boolean;
  additionalFilesToParse?: readonly string[];
  env?: Record<string, unknown>;
  // Dev server options
  hotReload?: boolean;
  host?: string;
  port?: string;
  publicDir?: string;
  singlePageApp?: boolean;
  headers?: Record<string, string>;
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
