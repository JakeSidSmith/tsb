import * as ts from 'typescript';
import * as vm from 'vm';
import { CONFIG_FILE_NAME, PROGRAM } from './constants';
import { Config } from './types';
import * as yup from 'yup';
import * as logger from './logger';

interface Sandbox {
  require: typeof require;
  process: typeof process;
  exports: { default?: Config };
}

const CONFIG_VALIDATOR = yup
  .object()
  .shape<Config>({
    bundle: yup
      .object()
      .shape<Config['bundle']>({
        inFile: yup.string().required(),
        outDir: yup.string().required(),
      })
      .required(),
    index: yup.lazy<Required<Config>['index'] | undefined>((value) => {
      if (value) {
        return yup
          .object()
          .shape<Required<Config>['index']>({
            inFile: yup.string().required(),
            outDir: yup.string().required(),
          })
          .required();
      }

      return yup.mixed<undefined>().optional();
    }),
    tsconfig: yup.string().optional(),
    port: yup.string().optional(),
    publicDir: yup.string().optional(),
    hashFiles: yup.boolean().optional(),
    compile: yup.array().of(yup.string().required()).optional(),
    env: yup.object().optional(),
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

  try {
    CONFIG_VALIDATOR.validateSync(sandbox.exports.default);
  } catch (error) {
    logger.error(error.errors.join('\n'));

    logger.error(`Invalid ${CONFIG_FILE_NAME}`);
    return process.exit(1);
  }

  return sandbox.exports.default as Config;
};
