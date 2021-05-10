import {
  Configuration,
  Plugin as WebpackPlugin,
  RuleSetRule as WebpackModuleRule,
} from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import { PluginItem as BabelPluginItem } from '@babel/core';

export interface Config {
  // Required
  /**
   * @description Path to your TypeScript/JavaScript entry point
   */
  main: string;
  /**
   * @description Path to the directory to output files
   */
  outDir: string;
  // Base options
  /**
   * @description List of commands for which the outDir should be cleared before
   */
  clearOutDirBefore?: readonly Command[];
  /**
   * @description Sub-directory to output JavaScript files within `outDir`
   */
  mainOutSubDir?: string;
  /**
   * @description Name for the main bundle output
   */
  mainBundleName?: string;
  /**
   * @description Path to tsconfig.json
   */
  tsconfigPath?: string;
  /**
   * @description Path to a custom index.html template
   */
  indexHTMLPath?: string;
  /**
   * @description List of commands for which to output index.html to disk
   */
  outputIndexHTMLFor?: readonly Command[];
  /**
   * @description Whether to add script tag to body, head, or not at all
   */
  insertScriptTag?: InsertScriptTag;
  /**
   * @description Whether React hot-loading is enabled
   */
  reactHotLoading?: boolean;
  /**
   * @description List of commands for which output bundles are hashed
   */
  hashFilesFor?: readonly Command[];
  /**
   * @description List of paths/globs to files outside of your tsconfig.json includes that should be parsed
   */
  additionalFilesToParse?: readonly string[];
  /**
   * @description Map of environment variables to include (key: variable name, value: default value (set undefined if you don't want a default))
   */
  env?: Env;
  // Dev server options
  /**
   * @description Whether hot-reloading is enabled
   */
  hotLoading?: boolean;
  /**
   * @description Host of the dev server (e.g. '0.0.0.0' or 'localhost')
   */
  host?: string;
  /**
   * @description Port to run the dev server on
   */
  port?: number;
  /**
   * @description Path to the directory in which additional public/static files should be served from
   */
  publicDir?: string;
  /**
   * @description Public path to refer to files stored in the `publicDir`
   */
  publicPath?: string;
  /**
   * @description Whether to enable SPA-style index.html serving and history API fallback
   */
  singlePageApp?: boolean;
  /**
   * @description Custom headers to send with dev server requests
   */
  headers?: Headers;
  /**
   * @description Extend the babel presets
   */
  extendBabelPresets?: (
    presets: readonly BabelPluginItem[],
    mode: Mode,
    command: Command
  ) => BabelPluginItem[];
  /**
   * @description Extend the babel plugins
   */
  extendBabelPlugins?: (
    plugins: readonly BabelPluginItem[],
    mode: Mode,
    command: Command
  ) => BabelPluginItem[];
  /**
   * @description Extend the webpack plugins
   */
  extendWebpackPlugins?: (
    plugins: readonly WebpackPlugin[],
    mode: Mode,
    command: Command
  ) => WebpackPlugin[];
  /**
   * @description Extend the webpack module.rules
   */
  extendWebpackModuleRules?: (
    rules: readonly WebpackModuleRule[],
    mode: Mode,
    command: Command
  ) => WebpackModuleRule[];
}

export type Headers = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Env = Record<string, any>;
export type Command = 'build' | 'watch' | 'serve';
export type InsertScriptTag = 'body' | 'head' | false;

export type Mode = 'development' | 'production';

export type JSX =
  | 'preserve'
  | 'react'
  | 'react-jsx'
  | 'react-jsxdev'
  | 'react-native';

export interface Tsconfig {
  include?: readonly string[];
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
