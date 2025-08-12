const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const config = require('./config');
require('dotenv').config();

const { setupSocketIO } = require('./config/socket.config');
const server = http.createServer(app);

mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    console.log('✅ MongoDB connected');

    try {
      const io = setupSocketIO(server);
      app.locals.io = io;

      console.log('✅ Socket.IO setup completed');

      server.listen(config.port, () => {
        console.log(`🚀 Server running at http://localhost:${config.port}`);
        console.log(`🔌 Socket.IO server ready`);
      });

      module.exports.io = io;
    } catch (error) {
      console.error('❌ Socket.IO setup error:', error);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
