const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path'); // ✅ Thêm import này
const config = require('./config');
const route = require('./routes');
require('dotenv').config();
require('./models');

const errorHandler = require('./middlewares/error.middleware.js');
const authRoutes = require('./routes/auth.route.js');
const { inventoryRoutes } = require('./routes/prototype/inventory.route.js');
const { drugRoutes } = require('./routes/prototype/drug.route.js');
const { CycleCountFormRoutes } = require('./routes/prototype/cycleCountForm.route.js');
const destroyRoutes = require('./routes/prototype/destroy.route.js');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'OK ✅ Server running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drug', drugRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cycle-count-form', CycleCountFormRoutes);
app.use('/api/', destroyRoutes);

// Gọi routes chung (nếu cần)
route(app);

// Serve static files in production
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API đang hoạt động!');
  });
}

// ✅ Error handler phải đặt cuối cùng
app.use(errorHandler);

module.exports = app;
