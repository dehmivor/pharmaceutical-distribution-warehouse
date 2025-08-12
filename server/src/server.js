const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const config = require('./config');
require('dotenv').config();

mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    console.log('✅ MongoDB connected');

    const server = http.createServer(app);

    const io = config.setupSocketIO.setupSocketIO(server, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    server.listen(config.port, () => {
      console.log(`🚀 Server running at http://localhost:${config.port}`);
    });

    module.exports.io = io;
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
