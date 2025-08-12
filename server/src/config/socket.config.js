// socket.config.js
const { Server } = require('socket.io');

const setupSocketIO = (server, options = {}) => {
  const defaultCorsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:3000'];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  };

  const io = new Server(server, {
    cors: options.cors || defaultCorsOptions,
    ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'cors')),
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { setupSocketIO };
