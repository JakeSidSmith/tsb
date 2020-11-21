import * as ts from 'typescript';
import * as path from 'path';
import * as vm from 'vm';
import { CONFIG_FILE_NAME, PROGRAM } from './constants';
import { Config } from './types';
import * as yup from 'yup';

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
  })
  .required();

export const getTsbConfig = (config = CONFIG_FILE_NAME): Config => {
  const tsbConfigPath = path.resolve(process.cwd(), config);

  const program = ts.createProgram({
    rootNames: [tsbConfigPath],
    options: {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
    },
  });

  const sourceFile = program.getSourceFile(tsbConfigPath);

  if (!sourceFile) {
    // eslint-disable-next-line no-console
    console.error(`Could not get ${PROGRAM} config source`);
    return process.exit(1);
  }

  const preEmitDiagnostics = ts.getPreEmitDiagnostics(program, sourceFile);

  if (preEmitDiagnostics?.length) {
    // eslint-disable-next-line no-console
    console.error(
      preEmitDiagnostics
        .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
        .join('\n')
    );
    // eslint-disable-next-line no-console
    console.error(`Invalid ${CONFIG_FILE_NAME}`);
    process.exit(1);
  }

  const transpileResult = ts.transpileModule(sourceFile.getText(), {
    fileName: tsbConfigPath,
    compilerOptions: {
      strict: true,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      module: ts.ModuleKind.CommonJS,
    },
  });

  if (transpileResult.diagnostics?.length) {
    // eslint-disable-next-line no-console
    console.error(
      transpileResult.diagnostics
        .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, '\n'))
        .join('\n')
    );
    // eslint-disable-next-line no-console
    console.error(`Invalid ${CONFIG_FILE_NAME}`);
    process.exit(1);
  }

  const script = new vm.Script(transpileResult.outputText, {
    filename: tsbConfigPath,
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
    // eslint-disable-next-line no-console
    console.error(error.errors.join('\n'));
    // eslint-disable-next-line no-console
    console.error(`Invalid ${CONFIG_FILE_NAME}`);
    return process.exit(1);
  }

  return sandbox.exports.default as Config;
};
