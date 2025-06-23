module.exports = {
  authMiddleware: require('./authMiddleware').authMiddleware,
  authenticate: require('./authenticate'),
  errorHandler: require('./error.middleware'),
  accountMiddleware: require('./accountMiddleware'),
};
