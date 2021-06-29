import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import path from 'path';
import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.tsx',
  outDir: 'build',
  mainOutSubDir: 'js',
  mainBundleName: 'index',
  indexHTMLPath: 'src/index.html',
  indexHTMLEnv: {
    TEST: 'Hello, World!',
  },
  tsconfigPath: 'tsconfig.test.json',
  env: {
    TEST: undefined,
  },
  publicDir: 'static',
  publicPath: '/static/',
  reactHotLoading: false,
  extendBabelPlugins: (plugins, _mode, command) => {
    if (command === 'serve') {
      return [...plugins, require.resolve('react-refresh/babel')];
    }

    return plugins;
  },
  extendWebpackPlugins: (plugins, _mode, command) => {
    if (command === 'serve') {
      return [...plugins, new ReactRefreshWebpackPlugin()];
    }

    return plugins;
  },
  extendWebpackModuleRules: (rules) => {
    return [
      ...rules,
      {
        test: /\.svg$/,
        include: [path.resolve('test-files/src/svg')],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
          {
            loader: 'react-svg-loader',
          },
        ],
      },
    ];
  },
};

export default config;
