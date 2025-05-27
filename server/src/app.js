const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const route = require("./routes")
require('dotenv').config();

const errorHandler = require('./middlewares/error.middleware.js');
const authRoutes = require('./routes/auth.route.js');
const { inventoryRoutes } = require('./routes/prototype/inventory.route.js');
const { drugRoutes } = require('./routes/prototype/drug.route.js');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'OK ✅ Server running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/drug', drugRoutes);
app.use('/api/inventory', inventoryRoutes);

app.get('/', (req, res) => {
  res.send('API đang hoạt động!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

app.use(errorHandler);

route(app)

module.exports = app;
