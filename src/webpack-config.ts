import * as path from 'path';
import { Configuration, EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Mode } from './types';
import { CONFIG_FILE_NAME, EXTENSIONS, MATCHES_EXTENSION } from './constants';
import { getTsconfig } from './tsconfig';
import { getTsbConfig } from './config';

export const createWebpackConfig = (
  configPath = CONFIG_FILE_NAME,
  mode: Mode
): Configuration => {
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  const configDir = path.dirname(fullConfigPath);
  const {
    tsconfigPath = 'tsconfig.json',
    env,
    bundle: { inFile: bundleInFile, outDir: bundleOutDir },
    hashFiles = true,
    additionalFilesToParse = [],
  } = getTsbConfig(fullConfigPath);

  const fullTsconfigPath = path.resolve(configDir, tsconfigPath);

  const tsconfig = getTsconfig(fullTsconfigPath);

  return {
    mode,
    devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
    stats: 'errors-only',
    entry: path.resolve(configDir, bundleInFile),
    output: {
      path: path.resolve(configDir, bundleOutDir),
      filename: `[name].bundle${
        hashFiles && mode !== 'development' ? '.[contenthash]' : ''
      }.js`,
    },
    module: {
      rules: [
        {
          test: MATCHES_EXTENSION,
          include: [...tsconfig.include].concat(
            [...additionalFilesToParse].map((comp) =>
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
          configFile: fullTsconfigPath,
          extensions: EXTENSIONS,
        }),
      ],
    },
    plugins: [
      new EnvironmentPlugin({
        NODE_ENV: mode === 'production' ? mode : 'development',
        ...env,
      }),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: fullTsconfigPath,
        },
      }),
    ],
  };
};
