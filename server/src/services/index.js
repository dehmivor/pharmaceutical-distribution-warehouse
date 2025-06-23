module.exports = {
  ...require('./mailtrapService'),
  ...require('./authService'),
  ...require('./cronService'),
  ...require('./emailService'),
  ...require('./notificationService'),
  ...require('./thingsboardService'),
};
