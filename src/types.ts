import { Configuration } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';

export interface Config {
  // Required
  main: string;
  outDir: string;
  mainOutSubDir?: string;
  indexHTML?: string;
  outputIndexHTMLFor?: readonly Command[];
  reactHotLoading?: boolean;
  tsconfigPath?: string;
  hashFilesFor?: readonly Command[];
  additionalFilesToParse?: readonly string[];
  env?: Env;
  // Dev server options
  hotReload?: boolean;
  host?: string;
  port?: number;
  publicDir?: string;
  publicPath?: string;
  singlePageApp?: boolean;
  headers?: Headers;
}

export type Headers = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Env = Record<string, any>;
export type Command = 'build' | 'watch' | 'serve';

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

export interface WebpackConfigs {
  base: Configuration;
  devServer: DevServerConfiguration &
    Required<Pick<DevServerConfiguration, 'port' | 'host'>>;
}
