import * as path from 'path';
import { Configuration, EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Mode } from './types';
import { CONFIG_FILE_NAME, EXTENSIONS, MATCHES_EXTENSION } from './constants';
import { getTsconfig } from './tsconfig';
import { getTsbConfig } from './config';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';

export const createWebpackConfig = (
  configPath = CONFIG_FILE_NAME,
  mode: Mode
): { base: Configuration; devServer: DevServerConfiguration } => {
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  const configDir = path.dirname(fullConfigPath);
  const {
    // Required
    bundle: {
      inFile: bundleInFile,
      outDir: bundleOutDir,
      publicDir: bundlePublicDir,
    },
    indexHTML,
    // Base options
    tsconfigPath = 'tsconfig.json',
    hashFiles = true,
    hashFilesInDev = false,
    additionalFilesToParse = [],
    env,
    // Dev server options
    hotReload = true,
    host = '0.0.0.0',
    port = 8080,
    publicDir,
    singlePageApp = true,
    headers,
  } = getTsbConfig(fullConfigPath);

  const fullTsconfigPath = path.resolve(configDir, tsconfigPath);

  const tsconfig = getTsconfig(fullTsconfigPath);

  const {
    inFile: indexInFile = 'index.html',
    outDir: indexOutDir = '.',
    outputInDev: indexOutputInDev = false,
  } = indexHTML ?? {};

  const indexHTMLPlugins = indexHTML
    ? [
        new HtmlWebpackPlugin({
          template: path.resolve(fullConfigPath, indexInFile),
          filename: path.resolve(fullConfigPath, indexOutDir, 'index.html'),
          alwaysWriteToDisk: mode === 'production' || indexOutputInDev,
        }),
        new HtmlWebpackHarddiskPlugin(),
      ]
    : [];

  return {
    base: {
      mode,
      devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
      stats: 'errors-only',
      entry: path.resolve(configDir, bundleInFile),
      output: {
        path: path.resolve(configDir, bundleOutDir),
        filename: `[name].bundle${
          hashFiles && (hashFilesInDev || mode !== 'development')
            ? '.[contenthash]'
            : ''
        }.js`,
        publicPath: path.resolve(
          fullConfigPath,
          bundlePublicDir ?? bundleOutDir
        ),
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
        ...indexHTMLPlugins,
      ],
    },
    devServer: {
      hot: hotReload,
      host,
      port,
      ...(singlePageApp
        ? { historyApiFallback: true, serveIndex: true }
        : null),
      headers,
      publicPath: publicDir,
    },
  };
};
