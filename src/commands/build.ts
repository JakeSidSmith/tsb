import webpack, { Configuration } from 'webpack';

const build = (webpackConfig: Configuration): void => {
  const start = Date.now();

  webpack(webpackConfig, (error, stats) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      // eslint-disable-next-line no-console
      console.error('Failed to compile');
      return process.exit(1);
    }

    if (stats?.compilation.errors.length) {
      stats.compilation.errors.forEach((compilationError) => {
        // eslint-disable-next-line no-console
        console.error(compilationError.message);
        // eslint-disable-next-line no-console
        console.error(compilationError.file);
      });

      // eslint-disable-next-line no-console
      console.error('Failed to compile');
      return process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.info(`Compiled in ${Date.now() - start} milliseconds`);
    return process.exit(0);
  });
};

export default build;
