export interface Config {
  bundle: {
    inFile: string;
    outDir: string;
  };
  index?: {
    inFile: string;
    outDir: string;
  };
  tsconfig?: string;
  port?: string;
  publicDir?: string;
  hashFiles?: boolean;
  compile?: readonly string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env?: Record<string, any>;
}

export type Mode = 'development' | 'production';
