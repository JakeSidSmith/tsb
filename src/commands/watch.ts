import webpack from 'webpack';
import { getTsbConfig } from '../config';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const build = (configPath: string | undefined): void => {
  const config = getTsbConfig(configPath);
  const webpackConfig = createWebpackConfig(config, 'development');
  const callback = createWebpackCallback(false);

  webpack(webpackConfig).watch({}, callback);
};

export default build;
