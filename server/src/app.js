const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path'); // Missing import
const config = require('./config');
const route = require('./routes');
require('dotenv').config();
require('./models');

// Middleware imports
const errorHandler = require('./middlewares/error.middleware.js');
const fakeSupervisor = require('./middlewares/FakeSupervisor');

// Route imports
const authRoutes = require('./routes/auth.route.js');
const { inventoryRoutes } = require('./routes/prototype/inventory.route.js');
const { drugRoutes } = require('./routes/prototype/drug.route.js');
const { parameterRoutes } = require('./routes/prototype/constant.route.js');
const checkRoutes = require('./routes/prototype/check.route.js');
const areaRoutes = require('./routes/prototype/area.route.js');
const locationRoutes = require('./routes/prototype/location.route.js');
const medicineRoutes = require('./routes/prototype/medicien.route.js');
const packageRoutes = require('./routes/prototype/package.route.js');
const { CycleCountFormRoutes } = require('./routes/prototype/cycleCountForm.route.js');
const destroyRoutes = require('./routes/prototype/destroy.route.js');

const app = express();

// Global middlewares
app.use(helmet());
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Environment check
const isProduction = process.env.NODE_ENV === 'production';
const __dirname = path.resolve();

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'OK ✅ Server running' });
});

// Home route
app.get('/', (req, res) => {
  res.send('API đang hoạt động!');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/drug', drugRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/check', fakeSupervisor, checkRoutes);
app.use('/api/areas', areaRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/cycle-count-form', CycleCountFormRoutes);
app.use('/api/', destroyRoutes);

// General routes (if any additional routes are defined in route function)
route(app);

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // Catch-all handler for client-side routing
  app.get('*', (req, res) => {
    return res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Custom error handler middleware
app.use(errorHandler);

module.exports = app;
