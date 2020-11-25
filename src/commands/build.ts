import webpack, { Configuration } from 'webpack';

const build = (webpackConfig: Configuration): void => {
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

    if (!stats?.compilation) {
      // eslint-disable-next-line no-console
      console.error(
        "Compiled... but we couldn't get info about how long it took"
      );
    } else {
      const time = (
        (stats.compilation.endTime - stats.compilation.startTime) /
        1000
      ).toFixed(2);

      // eslint-disable-next-line no-console
      console.info(`Compiled in ${time} seconds`);
    }

    return process.exit(0);
  });
};

export default build;
