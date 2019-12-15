const tweetRoutes = require('./tweetRoutes');
const notFound = require('./notFound');

module.exports = {
  tweets: tweetRoutes,
  notFound,
};
