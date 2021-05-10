import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { Config } from '../src';

const config: Config = {
  main: 'src/ts/index.tsx',
  outDir: 'build',
  mainOutSubDir: 'js',
  mainBundleName: 'index',
  indexHTMLPath: 'src/index.html',
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
};

export default config;
