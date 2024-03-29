import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG_FILE_NAME, PROGRAM } from './constants';
import { Command, Config, InsertScriptTag } from './types';
import * as yup from 'yup';
import * as logger from './logger';
import * as semver from 'semver';
import { getErrorMessages } from './utils';

const CONFIG_VALIDATOR = yup
  .object()
  .shape<Config>({
    // Required
    main: yup.string().required(),
    outDir: yup.string().required(),
    // Base options
    clearOutDirBefore: yup
      .array()
      .of<Command>(yup.mixed<Command>().oneOf(['build', 'watch', 'serve']))
      .optional(),
    mainOutSubDir: yup.string().optional(),
    mainBundleName: yup.string().optional(),
    tsconfigPath: yup.string().optional(),
    indexHTMLPath: yup.string().optional(),
    indexHTMLEnv: yup.object<Record<string, unknown>>().optional(),
    outputIndexHTMLFor: yup
      .array()
      .of<Command>(yup.mixed<Command>().oneOf(['build', 'watch', 'serve']))
      .optional(),
    insertScriptTag: yup
      .mixed<InsertScriptTag>()
      .oneOf(['body', 'head', false])
      .optional(),
    reactHotLoading: yup.boolean().optional(),
    hashFilesFor: yup
      .array()
      .of<Command>(yup.mixed<Command>().oneOf(['build', 'watch', 'serve']))
      .optional(),
    additionalFilesToParse: yup.array().of(yup.string().required()).optional(),
    env: yup.object<Record<string, unknown>>().optional(),
    // Dev server options
    hotLoading: yup.boolean().optional(),
    host: yup.string().optional(),
    port: yup.number().optional(),
    publicDir: yup.string().optional(),
    publicPath: yup.string().optional(),
    singlePageApp: yup.boolean().optional(),
    headers: yup.lazy<Record<string, string> | undefined>((value) => {
      if (value) {
        const keys: Record<string, yup.StringSchema<string>> = {};

        Object.keys(value).forEach((key) => {
          keys[key] = yup.string().required();
        });

        return yup.object().shape(keys).required();
      }

      return yup.mixed<undefined>().optional();
    }),
  })
  .required();

export const getTsbConfig = (configPath: string): Config => {
  const fullConfigDir = path.dirname(configPath);

  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const json = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  if (json.error) {
    logger.error(`Error reading ${tsconfigPath}`);
    logger.error(ts.flattenDiagnosticMessageText(json.error.messageText, '\n'));
    process.exit(1);
  }

  const configFileContent = ts.parseJsonConfigFileContent(
    json.config,
    ts.sys,
    process.cwd()
  );

  if (configFileContent.errors.length) {
    logger.error(`Error parsing ${tsconfigPath}`);
    logger.error(
      configFileContent.errors
        .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
        .join('\n')
    );
    process.exit(1);
  }

  const compilerOptions = {
    ...configFileContent.options,
    module: ts.ModuleKind.CommonJS,
  };

  const program = ts.createProgram({
    rootNames: [configPath],
    options: compilerOptions,
  });

  const sourceFile = program.getSourceFile(configPath);

  if (!sourceFile) {
    logger.error(`Could not get ${PROGRAM} config source`);
    return process.exit(1);
  }

  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

  if (preEmitDiagnostics?.length) {
    logger.error(
      preEmitDiagnostics
        .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
        .join('\n')
    );

    logger.error(`Invalid ${CONFIG_FILE_NAME}`);
    process.exit(1);
  }

  const transpileResult = ts.transpileModule(sourceFile.getText(), {
    fileName: configPath,
    compilerOptions,
  });

  if (transpileResult.diagnostics?.length) {
    logger.error(
      transpileResult.diagnostics
        .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
        .join('\n')
    );

    logger.error(`Invalid ${CONFIG_FILE_NAME}`);
    process.exit(1);
  }

  const tsbConfigFunction = Function(
    'exports',
    'require',
    'process',
    'console',
    transpileResult.outputText
  );

  const tsbConfigExports: Record<string, unknown> = {};

  try {
    tsbConfigFunction(tsbConfigExports, require, process, console);
  } catch (error) {
    logger.error(error);
    logger.error('Error running tsb.config.ts');
    return process.exit(1);
  }

  if (!tsbConfigExports.default) {
    logger.error('Your tsb.config.ts must export a default');
    return process.exit(1);
  }

  try {
    CONFIG_VALIDATOR.validateSync(tsbConfigExports.default);
  } catch (error) {
    logger.error(getErrorMessages(error));

    logger.error(`Invalid ${CONFIG_FILE_NAME}`);
    return process.exit(1);
  }

  const { default: config } = tsbConfigExports as { default: Config };

  if (config.env) {
    const missingEnvVars = Object.entries(config.env)
      .map(([key, value]) =>
        typeof value === 'undefined' && typeof process.env[key] === 'undefined'
          ? key
          : null
      )
      .filter((key) => key !== null);

    if (missingEnvVars.length) {
      missingEnvVars.forEach((envVar) => {
        logger.error(
          `Could not get value for environment variable "${envVar}" defined in config.env`
        );
      });
      return process.exit(1);
    }
  }

  let { indexHTMLEnv } = config;

  if (indexHTMLEnv) {
    const missingEnvVars = Object.entries(indexHTMLEnv)
      .map(([key, value]) =>
        typeof value === 'undefined' && typeof process.env[key] === 'undefined'
          ? key
          : null
      )
      .filter((key) => key !== null);

    if (missingEnvVars.length) {
      missingEnvVars.forEach((envVar) => {
        logger.error(
          `Could not get value for environment variable "${envVar}" defined in config.indexHTMLEnv`
        );
      });
      return process.exit(1);
    }

    indexHTMLEnv = Object.entries(indexHTMLEnv).reduce((memo, [key]) => {
      if (typeof process.env[key] !== 'undefined') {
        return {
          ...memo,
          [key]: process.env[key],
        };
      }

      return memo;
    }, indexHTMLEnv);
  }

  if (config.indexHTMLPath) {
    const fullIndexHTMLPath = path.resolve(fullConfigDir, config.indexHTMLPath);

    if (!fs.existsSync(fullIndexHTMLPath)) {
      logger.error(`Could not find index file at "${fullIndexHTMLPath}"`);
      return process.exit(1);
    }
  }

  if (config.reactHotLoading) {
    try {
      require.resolve('react-hot-loader');
    } catch (reactHotLoaderError) {
      logger.error(reactHotLoaderError);
      logger.error(
        'Could not resolve react-hot-loader (reactHotLoading is enabled)'
      );
      return process.exit(1);
    }

    const reactVersions: Record<string, string> = {
      react: 'Not installed',
      ['react-dom']: 'Not installed',
      ['@hot-loader/react-dom']: 'Not installed',
    };

    Object.keys(reactVersions).forEach((lib) => {
      try {
        const packagePath = require.resolve(`${lib}/package.json`);
        const packageContent = fs.readFileSync(packagePath, 'utf8');

        let packageJson: { version?: string } | null;

        try {
          packageJson = JSON.parse(packageContent);
        } catch (jsonError) {
          logger.error(jsonError);
          logger.error(
            `Failed to parse package.json of ${lib} (reactHotLoading is enabled)`
          );
          process.exit(1);
        }

        if (!packageJson?.version) {
          logger.error(
            `No version specified in package.json of ${lib} (reactHotLoading is enabled)`
          );
          process.exit(1);
        }

        reactVersions[lib] = packageJson.version;
      } catch (error) {
        logger.error(error);
        logger.error(
          `Failed to check installed version of ${lib} (reactHotLoading is enabled)`
        );
        process.exit(1);
      }
    });

    const resolvedVersions = Object.values(reactVersions).map(
      (version) => semver.coerce(version)?.major
    );

    const allVersionsAreTheSame = resolvedVersions.every(
      (version) => version === resolvedVersions[0]
    );

    if (!allVersionsAreTheSame) {
      logger.error(
        'Versions of installed React dependencies required for hot loading did not match'
      );
      Object.keys(reactVersions).forEach((lib) => {
        logger.info(`  ${lib}: ${reactVersions[lib]}`);
      });
      return process.exit(1);
    }
  }

  return {
    ...config,
    indexHTMLEnv,
  };
};
