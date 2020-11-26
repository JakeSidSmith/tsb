import webpack from 'webpack';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const build = (configPath: string | undefined): void => {
  const webpackConfig = createWebpackConfig(configPath, 'production');
  const callback = createWebpackCallback(true);

  webpack(webpackConfig.base).run(callback);
};

export default build;
