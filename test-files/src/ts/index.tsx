/* global document */
/* eslint-disable no-console */
// import 'react-hot-loader';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { message as alias, Enum, ConstEnum } from 'alias';
// import * as yup from 'not-yup';
import App from './app';

console.log(Array.from([alias]));

const element = document.createElement('div');
document.body.appendChild(element);

ReactDOM.render(<App />, element);

// const message = import(/* webpackChunkName: "required" */ './required');

// const validator = yup.array().of(yup.string());

console.log(process.env.TEST);

console.log(Enum.FOO, ConstEnum.BAR);

// message.then((text) => {
//   console.log(text);
// });

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
