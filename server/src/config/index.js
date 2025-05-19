const envConfig = require('./env.config');
const dbConfig = require('./db.config');
const mailConfig = require('./mail.config');

module.exports = {
  ...envConfig,
  db: dbConfig,
  mail: mailConfig,
};
