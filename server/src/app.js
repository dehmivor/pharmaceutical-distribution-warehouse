const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
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
app.use('/api/cycle-count-form', CycleCountFormRoutes);
app.use('/api/', destroyRoutes);

const isProduction = process.env.NODE_ENV === 'production';
const __dirname = path.resolve();

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

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  app.get('*', (req, res) => {
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
app.use(errorHandler);

route(app);

module.exports = app;
