import { JSX } from './types';

export const PROGRAM = 'tsb';
export const DESCRIPTION =
  'Dead simple TypeScript bundler, watcher, dev server, transpiler, and polyfiller';

export const CONFIG_FILE_NAME = `${PROGRAM}.config.ts`;

const TS_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts'];

const JS_EXTENSIONS = ['.js', '.jsx', '.cjs', '.mjs'];

export const EXTENSIONS = [...TS_EXTENSIONS, ...JS_EXTENSIONS];
export const MATCHES_EXTENSION = new RegExp(
  `\\.(${EXTENSIONS.map((ext) => ext.substr(1)).join('|')})$`
);
export const MATCHES_GLOB = /\/[*/]+\/?$/;

export const VALID_JSX_OPTIONS: readonly JSX[] = [
  'preserve',
  'react',
  'react-jsx',
  'react-jsxdev',
  'react-native',
];
