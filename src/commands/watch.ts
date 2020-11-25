import webpack from 'webpack';
import { getTsbConfig } from '../config';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const build = (configPath: string | undefined): void => {
  const config = getTsbConfig(configPath);
  const webpackConfig = createWebpackConfig(config, 'development', true);
  const callback = createWebpackCallback(false);

  webpack(webpackConfig, callback);
};

export default build;
