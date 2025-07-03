require('dotenv').config();

const allowedOrigins = [
  'https://pharmaceutical-distribution-warehou.vercel.app',
  'http://localhost:3000',
];

module.exports = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'https://pharmaceutical-distribution-warehou.vercel.app',
  allowedOrigins,
  jwtSecret: process.env.JWT_SECRET || 'secret',
};
