import webpack from 'webpack';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const build = (configPath: string | undefined): void => {
  const webpackConfig = createWebpackConfig(configPath, 'development');
  const callback = createWebpackCallback(false);

  webpack(webpackConfig.base).watch({}, callback);
};

export default build;
