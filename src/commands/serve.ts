import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { createWebpackConfig } from '../webpack-config';
import { createWebpackCallback } from '../webpack-callback';

const serve = (configPath: string | undefined): void => {
  const webpackConfig = createWebpackConfig(configPath, 'development');
  const callback = createWebpackCallback(false);

  WebpackDevServer.addDevServerEntrypoints(
    webpackConfig.base,
    webpackConfig.devServer
  );

  const compiler = webpack(webpackConfig.base);
  const server = new WebpackDevServer(compiler, webpackConfig.devServer);

  server.listen(
    webpackConfig.devServer.port,
    webpackConfig.devServer.host,
    callback
  );
};

export default serve;
