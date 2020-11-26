import * as yup from 'yup';
import * as path from 'path';
import * as ts from 'typescript';
import * as logger from './logger';

type JSX = 'preserve' | 'react' | 'react-jsx' | 'react-jsxdev' | 'react-native';

interface Tsconfig {
  include: readonly string[];
  extends?: string;
  compilerOptions?: {
    jsx?: JSX;
    sourceMap?: boolean;
  };
}

const TSCONFIG_VALIDATOR = yup
  .object()
  .shape<Tsconfig>({
    extends: yup.string().optional(),
    include: yup.array().of(yup.string().required()).required(),
    compilerOptions: yup.lazy<Tsconfig['compilerOptions']>((value) => {
      if (value) {
        return yup.object().shape({
          jsx: yup
            .mixed()
            .oneOf<JSX>([
              'preserve',
              'react',
              'react-jsx',
              'react-jsxdev',
              'react-native',
            ])
            .optional(),
          sourceMap: yup.boolean().optional(),
        });
      }

      return yup.mixed<undefined>().optional();
    }),
  })
  .required();

export const getTsconfig = (filePath: string): Tsconfig => {
  const tsconfigPath = ts.findConfigFile(filePath, ts.sys.fileExists);

  if (!tsconfigPath) {
    logger.error(`Could not resolve tsconfig.json at "${filePath}"`);
    return process.exit(1);
  }

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
    ? path.resolve(path.dirname(tsconfigPath), validTsconfig.extends)
    : null;

  if (extendedPath === tsconfigPath) {
    logger.error(
      `Invalid tsconfig.json at "${tsconfigPath}" - cannot extend itself`
    );
    return process.exit(1);
  }

  const extended = extendedPath ? getTsconfig(extendedPath) : null;

  return {
    ...extended,
    ...validTsconfig,
    compilerOptions: {
      ...extended?.compilerOptions,
      ...validTsconfig.compilerOptions,
    },
  };
};
