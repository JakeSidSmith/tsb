import { red, green, yellow, cyan } from 'chalk';

export const log = (message: unknown): void => {
  // eslint-disable-next-line no-console
  console.log(message);
};

export const success = (message: unknown): void => {
  if (typeof message === 'string') {
    // eslint-disable-next-line no-console
    console.log(green(message));
  } else {
    // eslint-disable-next-line no-console
    console.log(message);
  }
};

export const info = (message: unknown): void => {
  if (typeof message === 'string') {
    // eslint-disable-next-line no-console
    console.info(cyan(message));
  } else {
    // eslint-disable-next-line no-console
    console.info(message);
  }
};

export const warn = (message: unknown): void => {
  if (typeof message === 'string') {
    // eslint-disable-next-line no-console
    console.warn(yellow(message));
  } else {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
};

export const error = (message: unknown): void => {
  if (typeof message === 'string') {
    // eslint-disable-next-line no-console
    console.error(red(message));
  } else {
    // eslint-disable-next-line no-console
    console.error(message);
  }
};
