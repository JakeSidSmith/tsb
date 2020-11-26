import * as path from 'path';
import { Configuration, EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Mode } from './types';
import { CONFIG_FILE_NAME, EXTENSIONS, MATCHES_EXTENSION } from './constants';
import * as logger from './logger';
import { getTsconfig } from './tsconfig';
import { getTsbConfig } from './config';

export const createWebpackConfig = (
  configPath = CONFIG_FILE_NAME,
  mode: Mode
): Configuration => {
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  const configDir = path.dirname(fullConfigPath);
  const config = getTsbConfig(fullConfigPath);

  const tsconfigPath = path.resolve(
    configDir,
    config.tsconfigPath || 'tsconfig.json'
  );

  const tsconfig = getTsconfig(tsconfigPath);

  if (!tsconfig.resolved.compilerOptions?.sourceMap) {
    logger.warn(
      'No sourceMap enabled in tsconfig.json - source maps will not be generated'
    );
  }

  if (!tsconfig.resolved.include.length) {
    logger.error('No files in tsconfig.json include option');
    return process.exit(1);
  }

  const envPlugin = config.env ? [new EnvironmentPlugin(config.env)] : [];

  return {
    mode,
    devtool: tsconfig.resolved.compilerOptions?.sourceMap
      ? 'source-map'
      : undefined,
    stats: 'errors-only',
    entry: path.resolve(configDir, config.bundle.inFile),
    output: {
      path: path.resolve(configDir, config.bundle.outDir),
      filename: `bundle${config.hashFiles ? '.[contenthash]' : ''}.js`,
    },
    module: {
      rules: [
        {
          test: MATCHES_EXTENSION,
          include: [...tsconfig.resolved.include].concat(
            [...(config.additionalFilesToParse || [])].map((comp) =>
              path.resolve(configDir, comp)
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
