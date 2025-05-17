require('dotenv').config();

module.exports = {
  uri: process.env.MONGO_URI || 'mongodb://localhost:27017/PDW',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
