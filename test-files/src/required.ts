/* eslint-disable no-console */

const message = 'Hello, World!';

export const treeShakeMe = 'I should not exist';

if (treeShakeMe !== 'I should not exist') {
  console.log('I should not exist');
}

export default message;
