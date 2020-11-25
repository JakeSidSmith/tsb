#! /usr/bin/env node

import dotenv from 'dotenv';

dotenv.config();

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
import build from './commands/build';
import watch from './commands/watch';

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
        examples: [
          `${PROGRAM} build`,
          `${PROGRAM} watch`,
          `${PROGRAM} serve`,
          `${PROGRAM} build --config custom/path/to/tsb.config.ts`,
        ],
      },
      RequireAny(
        Command<CommonArgs>(
          'build',
          {
            description: 'Bundle TypeScript files (production)',
            callback: (tree) => {
              build(tree.kwargs.config);
            },
          },
          ...COMMON_ARGS
        ),
        Command<CommonArgs>(
          'watch',
          {
            description:
              'Watch TypeScript files and bundle them when changed (development)',
            callback: (tree) => {
              watch(tree.kwargs.config);
            },
          },
          ...COMMON_ARGS
        ),
        Command<CommonArgs>(
          'serve',
          {
            description: 'Run a dev server and update on change (development)',
            callback: () => {
              console.error('Not yet implemented');
              return process.exit(1);
            },
          },
          ...COMMON_ARGS
        )
      )
    )
  ),
  process.argv
);
