require('dotenv').config();

const allowedOrigins = [
  'http://localhost:3000',
  'https://pharmaceutical-distribution-warehou.vercel.app'
];

module.exports = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || 'https://pharmaceutical-distribution-warehou.vercel.app',
  allowedOrigins,
  jwtSecret: process.env.JWT_SECRET || 'secret',
};
