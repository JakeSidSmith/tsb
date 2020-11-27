import * as path from 'path';
import { EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Mode, WebpackConfigs } from './types';
import { CONFIG_FILE_NAME, EXTENSIONS, MATCHES_EXTENSION } from './constants';
import { getTsconfig } from './tsconfig';
import { getTsbConfig } from './config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';

export const createWebpackConfig = (
  configPath = CONFIG_FILE_NAME,
  mode: Mode
): WebpackConfigs => {
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  const fullConfigDir = path.dirname(fullConfigPath);

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

  const {
    inFile: indexInFile = 'index.html',
    outDir: indexOutDir = bundleOutDir,
    outputInDev: indexOutputInDev = false,
  } = indexHTML ?? {};

  const fullTsconfigPath = path.resolve(fullConfigDir, tsconfigPath);
  const fullIndexOutDir = path.resolve(fullConfigDir, indexOutDir);
  const fullBundleOutDir = path.resolve(fullConfigDir, bundleOutDir);

  const tsconfig = getTsconfig(fullTsconfigPath);

  const isReactAppDev = Boolean(
    tsconfig.compilerOptions?.jsx?.startsWith('react') && mode === 'development'
  );

  const additionalEntries = isReactAppDev ? ['react-hot-loader'] : [];
  const babelPlugins = isReactAppDev ? ['react-hot-loader/babel'] : [];
  const alias: Record<string, string> = isReactAppDev
    ? { ['react-dom']: '@hot-loader/react-dom' }
    : {};

  const shouldOutputHTML = Boolean(indexOutputInDev || mode === 'production');

  return {
    base: {
      mode,
      devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
      stats: 'errors-only',
      entry: [...additionalEntries, path.resolve(fullConfigDir, bundleInFile)],
      output: {
        path: fullBundleOutDir,
        filename: `[name].bundle${
          hashFiles && (hashFilesInDev || mode !== 'development')
            ? '.[contenthash]'
            : ''
        }.js`,
        publicPath: path.resolve(
          '/',
          bundlePublicDir ?? path.relative(fullIndexOutDir, fullBundleOutDir)
        ),
      },
      module: {
        rules: [
          {
            test: MATCHES_EXTENSION,
            include: [...tsconfig.include].concat(
              [...additionalFilesToParse].map((comp) =>
                path.resolve(fullConfigDir, comp)
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
                  plugins: babelPlugins,
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
        alias,
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
        new HtmlWebpackPlugin(
          indexHTML
            ? {
                template: path.resolve(fullConfigDir, indexInFile),
                filename: path.resolve(fullIndexOutDir, 'index.html'),
                alwaysWriteToDisk: shouldOutputHTML,
              }
            : {}
        ),
        new HtmlWebpackHarddiskPlugin(),
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
