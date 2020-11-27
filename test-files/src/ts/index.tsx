/* global document */
/* eslint-disable no-console */

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { message as alias, Enum, ConstEnum } from 'alias';
// import * as yup from 'not-yup';
import App from './app';

ReactDOM.render(<App />, document.getElementById('app'));

const message = import(/* webpackChunkName: "required" */ './required');

// const validator = yup.array().of(yup.string());

console.log(process.env.TEST);

console.log(Enum.FOO, ConstEnum.BAR);

message.then((text) => {
  console.log(Array.from([text, alias]));
});

// validator
//   .validate(Array.from([message, alias]))
//   .then((result) => {
//     console.log('Was valid');
//     console.log(result);
//   })
//   .catch((error) => {
//     console.error('Was invalid');
//     console.error(error);
//   });
