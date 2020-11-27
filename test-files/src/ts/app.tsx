import React, { memo } from 'react';
import { hot } from 'react-hot-loader/root';
import Sub from './sub';

const App = () => {
  return (
    <>
      <p>Below is a sub-component</p>
      <Sub />
    </>
  );
};

export default hot(memo(App));
