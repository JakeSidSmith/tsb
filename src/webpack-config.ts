import * as path from 'path';
import { Configuration, EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Config, Mode } from './types';
import { EXTENSIONS, MATCHES_EXTENSION } from './constants';
import * as logger from './logger';
import { getTsconfig } from './tsconfig';

export const createWebpackConfig = (
  config: Config,
  mode: Mode
): Configuration => {
  const tsconfigPath = path.resolve(
    process.cwd(),
    config.tsconfig || 'tsconfig.json'
  );
  const tsconfigDir = path.dirname(tsconfigPath);

  const tsconfig = getTsconfig(tsconfigPath);

  if (!tsconfig.compilerOptions?.sourceMap) {
    logger.warn(
      'No sourceMap enabled in tsconfig.json - source maps will not be generated'
    );
  }

  if (!tsconfig.include.length) {
    logger.error('No files in tsconfig.json include option');
    return process.exit(1);
  }

  const envPlugin = config.env ? [new EnvironmentPlugin(config.env)] : [];

  return {
    mode,
    devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
    stats: 'errors-only',
    entry: path.resolve(process.cwd(), config.bundle.inFile),
    output: {
      path: path.resolve(process.cwd(), config.bundle.outDir),
      filename: `bundle${config.hashFiles ? '.[contenthash]' : ''}.js`,
    },
    module: {
      rules: [
        {
          test: MATCHES_EXTENSION,
          include: [...tsconfig.include]
            .map((include) => path.resolve(tsconfigDir, include))
            .concat(
              [...(config.compile || [])].map((comp) =>
                path.resolve(process.cwd(), comp)
              )
            ),
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      useBuiltIns: 'usage',
                      corejs: {
                        version: 3,
                        proposals: true,
                      },
                    },
                  ],
                ],
              },
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: EXTENSIONS,
      plugins: [
        new TsconfigPathsPlugin({
          configFile: tsconfigPath,
          extensions: EXTENSIONS,
        }),
      ],
    },
    plugins: [
      ...envPlugin,
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: tsconfigPath,
        },
      }),
    ],
  };
};
