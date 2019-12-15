/* eslint-disable class-methods-use-this, no-console */
const { TweetsController } = require('../controllers');

module.exports = (data, callBack) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.includes(data.method)) {
    TweetsController[data.method](data, callBack);
  } else {
    callBack(405);
  }
};
