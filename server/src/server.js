const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
require('dotenv').config();

mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    console.log('✅ MongoDB connected');
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running at http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
