#! /usr/bin/env node

import {
  collect,
  Program,
  Help,
  Command,
  RequireAny,
  Tree,
  KWArg,
} from 'jargs';

import { PROGRAM, DESCRIPTION } from './constants';
import { getTsbConfig } from './config';
import { createWebpackConfig } from './webpack-config';
import build from './commands/build';

const COMMON_ARGS = [
  KWArg('config', {
    alias: 'c',
    description: `Path to ${PROGRAM}.config.ts`,
  }),
];

type CommonArgs = Tree<
  undefined,
  { config?: string },
  Record<string, never>,
  Record<string, never>
>;

collect(
  Help(
    'help',
    {
      description: 'Display help and usage info',
    },
    Program(
      PROGRAM,
      {
        description: DESCRIPTION,
        usage: `${PROGRAM} <command>`,
        examples: [`${PROGRAM} build`, `${PROGRAM} watch`, `${PROGRAM} serve`],
      },
      RequireAny(
        Command<CommonArgs>(
          'build',
          {
            description: 'Bundle TypeScript files',
            callback: (tree) => {
              const config = getTsbConfig(tree.kwargs.config);
              const webpackConfig = createWebpackConfig(config, 'production');
              build(webpackConfig);
            },
          },
          ...COMMON_ARGS
        ),
        Command<CommonArgs>(
          'watch',
          {
            description: 'Watch TypeScript files and bundle them when changed',
            callback: () => {
              console.error('Not yet implemented');
              return process.exit(1);
            },
          },
          ...COMMON_ARGS
        ),
        Command('serve', {
          description:
            'Run a dev server and bundle TypeScript files when changed',
          callback: () => {
            console.error('Not yet implemented');
            return process.exit(1);
          },
        })
      )
    )
  ),
  process.argv
);
