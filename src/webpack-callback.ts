import { Stats } from 'webpack';
import * as logger from './logger';

type WebpackCallback = (error?: Error, stats?: Stats) => void;

export const createWebpackCallback = (exit: boolean): WebpackCallback => (
  error,
  stats
) => {
  if (error) {
    logger.error(error);
  } else if (stats?.compilation.errors.length) {
    stats.compilation.errors.forEach((compilationError) => {
      logger.error(compilationError.message);
      logger.error(compilationError.file);
    });
  }

  if (error || stats?.compilation.errors.length) {
    logger.error('Failed to compile');

    if (exit) {
      return process.exit(1);
    }
  }

  if (!stats?.compilation) {
    logger.warn("Compiled... but we couldn't get info about how long it took");
  } else {
    const time = (
      (stats.compilation.endTime - stats.compilation.startTime) /
      1000
    ).toFixed(2);

    logger.success(`Compiled in ${time} seconds`);
  }

  if (exit) {
    return process.exit(0);
  }

  return;
};
