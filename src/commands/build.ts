import webpack, { Configuration } from 'webpack';
import * as logger from '../logger';

const build = (webpackConfig: Configuration): void => {
  webpack(webpackConfig).run((error, stats) => {
    if (error) {
      logger.error(error);
      logger.error('Failed to compile');
      return process.exit(1);
    }

    if (stats?.compilation.errors.length) {
      stats.compilation.errors.forEach((compilationError) => {
        logger.error(compilationError.message);
        logger.error(compilationError.file);
      });

      logger.error('Failed to compile');
      return process.exit(1);
    }

    if (!stats?.compilation) {
      logger.warn(
        "Compiled... but we couldn't get info about how long it took"
      );
    } else {
      const time = (
        (stats.compilation.endTime - stats.compilation.startTime) /
        1000
      ).toFixed(2);

      logger.success(`Compiled in ${time} seconds`);
    }

    return process.exit(0);
  });
};

export default build;
