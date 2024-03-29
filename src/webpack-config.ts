import * as path from 'path';
import { EnvironmentPlugin } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Command, Mode, WebpackConfigs } from './types';
import {
  CONFIG_FILE_NAME,
  EXTENSIONS,
  MATCHES_EXTENSION,
  MATCHES_GLOB,
} from './constants';
import { getTsconfig, resolveTsconfigPath } from './tsconfig';
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
    clearOutDirBefore = [],
    mainOutSubDir,
    mainBundleName = 'bundle',
    tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json'),
    indexHTMLPath,
    indexHTMLEnv = {},
    outputIndexHTMLFor = ['build', 'watch'],
    insertScriptTag = 'body',
    scriptLoading = 'blocking',
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
    https,
    extendBabelPresets,
    extendBabelPlugins,
    extendWebpackPlugins,
    extendWebpackModuleRules,
  } = getTsbConfig(fullConfigPath);

  const fullTsconfigPath = resolveTsconfigPath(fullConfigDir, tsconfigPath);
  const fullOutDir = path.resolve(fullConfigDir, outDir);
  const bundleOutSubDirRelative = path.relative(
    fullOutDir,
    mainOutSubDir ? path.resolve(fullOutDir, mainOutSubDir) : fullOutDir
  );

  const tsconfig = getTsconfig(fullTsconfigPath);

  const isReactAppDev = reactHotLoading && mode === 'development';

  const additionalEntries = isReactAppDev
    ? [require.resolve('react-hot-loader/patch')]
    : [];
  const babelPlugins = isReactAppDev
    ? [require.resolve('react-hot-loader/babel')]
    : [];
  const babelPresets = [
    [
      require.resolve('@babel/preset-env'),
      {
        modules: false,
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true,
        },
      },
    ],
  ];
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
                  inject: insertScriptTag,
                  scriptLoading,
                  templateParameters: indexHTMLEnv,
                }
              : {
                  alwaysWriteToDisk: shouldOutputHTML,
                  inject: insertScriptTag,
                  scriptLoading,
                  meta: {
                    viewport: 'width=device-width, initial-scale=1',
                  },
                  templateParameters: indexHTMLEnv,
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

  const tsconfigInclude = (tsconfig.include ?? []).map((comp) =>
    comp.replace(MATCHES_GLOB, '')
  );

  const additionalInclude = additionalFilesToParse.map((comp) =>
    path.resolve(fullConfigDir, comp)
  );

  const webpackModuleRules = [
    {
      test: MATCHES_EXTENSION,
      include: [...tsconfigInclude, ...additionalInclude],
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            babelrc: false,
            presets: extendBabelPresets
              ? extendBabelPresets(babelPresets, mode, command)
              : babelPresets,
            plugins: extendBabelPlugins
              ? extendBabelPlugins(babelPlugins, mode, command)
              : babelPlugins,
          },
        },
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
            configFile: fullTsconfigPath,
          },
        },
      ],
    },
  ];

  const webpackPlugins = [
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
  ];

  return {
    base: {
      mode,
      devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
      stats: 'errors-only',
      entry: {
        [mainBundleName]: [
          ...additionalEntries,
          path.resolve(fullConfigDir, main),
        ],
      },
      output: {
        path: fullOutDir,
        filename: `${
          bundleOutSubDirRelative ? `${bundleOutSubDirRelative}/` : ''
        }[name]${hashFilesFor.includes(command) ? '.[contenthash]' : ''}.js`,
        publicPath: singlePageApp ? '/' : '',
      },
      module: {
        rules: extendWebpackModuleRules
          ? extendWebpackModuleRules(webpackModuleRules, mode, command)
          : webpackModuleRules,
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
      plugins: extendWebpackPlugins
        ? extendWebpackPlugins(webpackPlugins, mode, command)
        : webpackPlugins,
    },
    devServer: {
      hot: hotLoading,
      inline: true,
      https,
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
