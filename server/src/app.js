const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const route = require('./routes');
require('dotenv').config();
const models = require('./models');
const app = express();

const errorHandler = require('./middlewares/error.middleware.js');
const { authRoutes, cronRoutes, medicineRoutes, batchRoutes, locationRoutes } = require('./routes');
const importOrderRoutes = require('./routes/importOrderRoutes');

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

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/location', locationRoutes);

// Import Order routes
app.use('/api/import-orders', importOrderRoutes);

// Protected routes với role-based access
// app.use('/api/supervisor', authenticate, authorize('supervisor'), routes.supervisorRoutes);

// app.use(
//   '/api/warehouse',
//   authenticate,
//   authorize(['supervisor', 'warehouse_manager']),
//   routes.warehouseRoutes,
// );

// app.use(
//   '/api/presentative',
//   authenticate,
//   authorize(['supervisor', 'presentative']),
//   routes.pharmacyRoutes,
// );

const startAllCrons = require('./cron');
startAllCrons();

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});
app.use(errorHandler);

module.exports = app;
