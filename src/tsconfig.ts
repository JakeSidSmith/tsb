import * as yup from 'yup';
import * as path from 'path';
import * as ts from 'typescript';
import * as logger from './logger';
import { Tsconfig } from './types';
import { VALID_JSX_OPTIONS } from './constants';

const TSCONFIG_VALIDATOR = yup
  .object()
  .shape<Tsconfig>({
    extends: yup.string().optional(),
    include: yup.array().of(yup.string().required()).required(),
    compilerOptions: yup.lazy<Tsconfig['compilerOptions']>((value) => {
      if (value) {
        return yup.object().shape({
          jsx: yup.mixed().oneOf(VALID_JSX_OPTIONS).optional(),
          sourceMap: yup.boolean().optional(),
          module: yup.string().optional(),
        });
      }

      return yup.mixed<undefined>().optional();
    }),
  })
  .required();

export const resolveTsconfig = (
  filePath: string
): { raw: Tsconfig; resolved: Tsconfig } => {
  const tsconfigPath = ts.findConfigFile(filePath, ts.sys.fileExists);

  if (!tsconfigPath) {
    logger.error(`Could not resolve tsconfig.json at "${filePath}"`);
    return process.exit(1);
  }

  const tsconfigDir = path.dirname(tsconfigPath);

  const tsconfig = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  if (tsconfig.error) {
    logger.error(
      ts.flattenDiagnosticMessageText(tsconfig.error.messageText, '\n')
    );
    logger.error(`Error reading tsconfig.json at "${tsconfigPath}"`);
    return process.exit(1);
  }

  const validTsconfig: Tsconfig = tsconfig.config;

  try {
    TSCONFIG_VALIDATOR.validateSync(validTsconfig);
  } catch (error) {
    logger.error(error.errors.join('\n'));
    logger.error(`Invalid tsconfig.json at "${tsconfigPath}"`);
    return process.exit(1);
  }

  const extendedPath = validTsconfig.extends
    ? path.resolve(tsconfigDir, validTsconfig.extends)
    : null;

  if (extendedPath === tsconfigPath) {
    logger.error(
      `Invalid tsconfig.json at "${tsconfigPath}" - cannot extend itself`
    );
    return process.exit(1);
  }

  const extended = extendedPath ? resolveTsconfig(extendedPath) : null;

  return {
    raw: validTsconfig,
    resolved: {
      ...extended?.raw,
      ...validTsconfig,
      include: validTsconfig.include.map((include) =>
        path.resolve(tsconfigDir, include)
      ),
      compilerOptions: {
        ...extended?.raw.compilerOptions,
        ...validTsconfig.compilerOptions,
      },
    },
  };
};

export const getTsconfig = (configPath: string): Tsconfig => {
  const { resolved } = resolveTsconfig(configPath);

  if (!resolved.compilerOptions?.sourceMap) {
    logger.warn(
      'No sourceMap enabled in tsconfig.json - source maps will not be generated'
    );
  }

  if (!resolved.include.length) {
    logger.error(
      'No files in tsconfig.json include option - specify some files to parse'
    );
    return process.exit(1);
  }

  if (
    resolved.compilerOptions?.module &&
    !resolved.compilerOptions.module.toLowerCase().startsWith('es')
  ) {
    logger.warn(
      `Your tsconfig.json module was set to "${resolved.compilerOptions.module}".
You should target an ES module type e.g. "ESNext" to get the full benefits of this bundler.
We'll handle converting everything to CommonJS for you.`
    );
  }

  return resolved;
};
