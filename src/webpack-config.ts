import * as path from 'path';
import { EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Command, Mode, WebpackConfigs } from './types';
import { CONFIG_FILE_NAME, EXTENSIONS, MATCHES_EXTENSION } from './constants';
import { getTsconfig } from './tsconfig';
import { getTsbConfig } from './config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';
import rimraf from 'rimraf';
import * as logger from './logger';

export const createWebpackConfig = (
  configPath = CONFIG_FILE_NAME,
  mode: Mode,
  command: Command
): WebpackConfigs => {
  const fullConfigPath = path.resolve(process.cwd(), configPath);
  const fullConfigDir = path.dirname(fullConfigPath);

  const {
    // Required
    main,
    outDir,
    // Base options
    clearOutDirBefore = ['build', 'watch'],
    mainOutSubDir,
    tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json'),
    indexHTMLPath,
    outputIndexHTMLFor = ['build', 'watch'],
    reactHotLoading = false,
    hashFilesFor = ['build', 'watch'],
    additionalFilesToParse = [],
    env,
    // Dev server options
    hotLoading = true,
    host = '0.0.0.0',
    port = 8080,
    publicDir,
    publicPath,
    singlePageApp = true,
    headers,
  } = getTsbConfig(fullConfigPath);

  const fullTsconfigPath = path.resolve(fullConfigDir, tsconfigPath);
  const fullOutDir = path.resolve(fullConfigDir, outDir);
  const bundleOutSubDirRelative = path.relative(
    fullOutDir,
    path.resolve(fullOutDir, mainOutSubDir ?? outDir)
  );

  const tsconfig = getTsconfig(fullTsconfigPath);

  const isReactAppDev = reactHotLoading && mode === 'development';

  const additionalEntries = isReactAppDev ? ['react-hot-loader/patch'] : [];
  const babelPlugins = isReactAppDev ? ['react-hot-loader/babel'] : [];
  const alias: Record<string, string> = isReactAppDev
    ? { ['react-dom']: '@hot-loader/react-dom' }
    : {};

  const shouldOutputHTML = outputIndexHTMLFor.includes(command);

  const htmlPlugins =
    outputIndexHTMLFor.includes(command) || command === 'serve'
      ? [
          new HtmlWebpackPlugin(
            indexHTMLPath
              ? {
                  template: path.resolve(fullConfigDir, indexHTMLPath),
                  filename: path.resolve(fullOutDir, 'index.html'),
                  alwaysWriteToDisk: shouldOutputHTML,
                }
              : {
                  alwaysWriteToDisk: shouldOutputHTML,
                  meta: {
                    viewport: 'width=device-width, initial-scale=1',
                  },
                }
          ),
          new HtmlWebpackHarddiskPlugin(),
        ]
      : [];

  if (clearOutDirBefore.includes(command)) {
    logger.log(`Clearing out dir...`);
    rimraf.sync(fullOutDir);
    logger.log(`Cleared ${fullOutDir}`);
  }

  return {
    base: {
      mode,
      devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
      stats: 'errors-only',
      entry: [...additionalEntries, path.resolve(fullConfigDir, main)],
      output: {
        path: fullOutDir,
        filename: `${
          bundleOutSubDirRelative ? `${bundleOutSubDirRelative}/` : ''
        }[name].bundle${
          hashFilesFor.includes(command) ? '.[contenthash]' : ''
        }.js`,
        publicPath: singlePageApp ? '/' : '',
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
        ...htmlPlugins,
      ],
    },
    devServer: {
      hot: hotLoading,
      inline: true,
      host,
      port,
      ...(singlePageApp
        ? { historyApiFallback: true, serveIndex: true }
        : null),
      headers,
      contentBase:
        typeof publicDir === 'string'
          ? path.resolve(fullConfigDir, publicDir)
          : undefined,
      contentBasePublicPath: publicPath,
      stats: {
        colors: true,
        assets: false,
        children: false,
        chunks: false,
        chunkModules: false,
        entrypoints: false,
        hash: false,
        modules: false,
        timings: false,
        version: false,
      },
    },
  };
};
