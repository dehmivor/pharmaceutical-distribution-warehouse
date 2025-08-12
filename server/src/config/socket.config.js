const { Server } = require('socket.io');

const setupSocketIO = (server, options = {}) => {
  const defaultCorsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'https://pharmaceutical-distribution-warehou.vercel.app',
        process.env.CLIENT_URL,
      ].filter(Boolean);

      // Cho phép kết nối từ localhost và vercel
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  const io = new Server(server, {
    cors: options.cors || defaultCorsOptions,
    transports: ['polling', 'websocket'],
    allowEIO3: true,
    ...Object.fromEntries(Object.entries(options).filter(([key]) => key !== 'cors')),
  });

  io.on('connection', (socket) => {
    // Xử lý join nhiều room cùng lúc
    socket.on('joinRooms', (rooms) => {
      if (!rooms) return;

      console.log('User joining rooms:', rooms);

      // Chỉ join 1 lần
      if (Array.isArray(rooms)) {
        rooms.forEach((room) => {
          socket.join(room);
          console.log(`User ${socket.id} joined room ${room}`);
        });
      } else if (typeof rooms === 'string' && rooms.trim() !== '') {
        socket.join(rooms);
        console.log(`User ${socket.id} joined room ${rooms}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { setupSocketIO };
