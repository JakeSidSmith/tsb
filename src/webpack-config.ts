import * as path from 'path';
import * as fs from 'fs';
import * as yup from 'yup';
import { Configuration } from 'webpack';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Config, Mode } from './types';
import { EXTENSIONS, MATCHES_EXTENSION, UTF8 } from './constants';

interface Tsconfig {
  include: readonly string[];
  compilerOptions?: {
    sourceMap?: boolean;
  };
}

const TSCONFIG_VALIDATOR = yup
  .object()
  .shape<Tsconfig>({
    include: yup.array().of(yup.string().required()).required(),
  })
  .required();

export const getTsconfig = (tsconfigPath: string): Tsconfig => {
  const tsconfigContent = fs.readFileSync(tsconfigPath, UTF8);

  let tsconfig: Tsconfig;

  try {
    tsconfig = JSON.parse(tsconfigContent);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    // eslint-disable-next-line no-console
    console.error('Failed to parse tsconfig');
    return process.exit(1);
  }

  try {
    TSCONFIG_VALIDATOR.validateSync(tsconfig);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error.errors.join('\n'));
    // eslint-disable-next-line no-console
    console.error('Invalid tsconfig.json');
    return process.exit(1);
  }

  if (!tsconfig.include.length) {
    // eslint-disable-next-line no-console
    console.error('No files in tsconfig include option');
    return process.exit(1);
  }

  return tsconfig;
};

export const createWebpackConfig = (
  config: Config,
  mode: Mode
): Configuration => {
  const tsconfigPath = path.resolve(
    process.cwd(),
    config.tsconfig || 'tsconfig.json'
  );
  const tsconfigDir = path.dirname(tsconfigPath);

  const tsconfig = getTsconfig(tsconfigPath);

  return {
    mode,
    devtool: tsconfig.compilerOptions?.sourceMap ? 'source-map' : undefined,
    stats: 'errors-only',
    entry: path.resolve(process.cwd(), config.bundle.inFile),
    output: {
      path: path.resolve(process.cwd(), config.bundle.outDir),
      filename: `bundle${config.hashFiles ? '.[contenthash]' : ''}.js`,
    },
    module: {
      rules: [
        {
          test: MATCHES_EXTENSION,
          include: [...tsconfig.include]
            .map((include) => path.resolve(tsconfigDir, include))
            .concat(
              [...(config.compile || [])].map((comp) =>
                path.resolve(process.cwd(), comp)
              )
            ),
          use: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false,
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      modules: false,
                      useBuiltIns: 'usage',
                      corejs: {
                        version: 3,
                        proposals: true,
                      },
                    },
                  ],
                ],
              },
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: EXTENSIONS,
      plugins: [
        new TsconfigPathsPlugin({
          configFile: tsconfigPath,
          extensions: EXTENSIONS,
        }),
      ],
    },
    plugins: [
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: tsconfigPath,
        },
      }),
    ],
  };
};
