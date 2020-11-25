export const PROGRAM = 'tsb';
export const DESCRIPTION =
  'Dead simple TypeScript bundler, watcher, dev server, transpiler, and polyfiller';

export const CONFIG_FILE_NAME = `${PROGRAM}.config.ts`;

export const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs'];
export const MATCHES_EXTENSION = new RegExp(
  `\\.(${EXTENSIONS.map((ext) => ext.substr(1)).join('|')})$`
);

export const UTF8 = 'utf8';
