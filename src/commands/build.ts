import webpack from 'webpack';
import { getTsbConfig } from '../config';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const build = (configPath: string | undefined): void => {
  const config = getTsbConfig(configPath);
  const webpackConfig = createWebpackConfig(config, 'production');
  const callback = createWebpackCallback(true);

  webpack(webpackConfig).run(callback);
};

export default build;
