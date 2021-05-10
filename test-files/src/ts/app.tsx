import React, { memo } from 'react';
import Sub from './sub';

const App = () => {
  return (
    <>
      <p>Below is a sub-component</p>
      <Sub />
    </>
  );
};

export default memo(App);
