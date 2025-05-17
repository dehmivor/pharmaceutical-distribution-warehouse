const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config');
require('dotenv').config();

console.log('process.env.MONGO_URI:', process.env.MONGO_URI);
mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(config.port, () => {
      console.log(`MONGO_URI: ${config.db.uri}`);
      console.log(`🚀 Server running at http://localhost:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
