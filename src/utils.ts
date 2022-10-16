import { ValidationError } from 'yup';

export const getErrorMessages = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof ValidationError) {
    return error.errors.join('\n');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
};
