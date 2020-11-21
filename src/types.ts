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
}

export type Mode = 'development' | 'production';
