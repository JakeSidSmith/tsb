import * as ts from 'typescript';
import * as vm from 'vm';
import * as fs from 'fs';
import { CONFIG_FILE_NAME, PROGRAM } from './constants';
import { Command, Config } from './types';
import * as yup from 'yup';
import * as logger from './logger';
import * as semver from 'semver';

interface Sandbox {
  require: typeof require;
  process: typeof process;
  exports: { default?: Config };
}

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
    outputIndexHTMLFor: yup
      .array()
      .of<Command>(yup.mixed<Command>().oneOf(['build', 'watch', 'serve']))
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
  const program = ts.createProgram({
    rootNames: [configPath],
    options: {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
    },
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
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
    },
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

  const script = new vm.Script(transpileResult.outputText, {
    filename: configPath,
  });
  const sandbox: Sandbox = {
    require,
    process,
    exports: {},
  };
  script.runInNewContext(sandbox);

  if (!sandbox.exports.default) {
    logger.error('Your tsb.config.ts must export a default');
    return process.exit(1);
  }

  try {
    CONFIG_VALIDATOR.validateSync(sandbox.exports.default);
  } catch (error) {
    logger.error(error.errors.join('\n'));

    logger.error(`Invalid ${CONFIG_FILE_NAME}`);
    return process.exit(1);
  }

  const { default: config } = sandbox.exports;

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

  return config;
};
