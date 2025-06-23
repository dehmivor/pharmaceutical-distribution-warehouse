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
const authenticate = require('./middlewares/authenticate');
const authorize = require('./middlewares/authorize');

const {
  authRoutes,
  cronRoutes,
  medicineRoutes,
  supervisorRoutes,
  packageRoutes,
} = require('./routes');
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

app.use('/api/import-orders', route.importOrderRoutes);
app.use('api/thingsboard', route.thingsboardRoutes);

// Protected routes với role-based access
app.use('/api/supervisor', authenticate, authorize('supervisor'), supervisorRoutes);
app.use('/api/accounts', authenticate, authorize('supervisor'), route.accountRoutes);

// app.use('/api/warehouse', authenticate, authorize(['supervisor', 'warehouse']), warehouseRoutes);

// app.use(
//   '/api/representative',
//   authenticate,
//   authorize(['supervisor', 'representative']),
//   representativeRoutes,
// );

// Shared routes cho multiple roles
app.use(
  '/api/shared',
  authenticate,
  authorize(['supervisor', 'representative', 'warehouse']),
  (req, res) => {
    res.json({
      success: true,
      data: 'Shared data accessible by multiple roles',
      userRole: req.user.role,
    });
  },
);

const startAllCrons = require('./cron');
startAllCrons();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});
app.use(errorHandler);

module.exports = app;
