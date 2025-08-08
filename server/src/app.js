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

const errorHandler = require('./middlewares/errorMiddleware.js');
const authenticate = require('./middlewares/authenticate');
const authorize = require('./middlewares/authorize');
const { USER_ROLES } = require('./utils/constants');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    try {
      const url = new URL(origin);
      if (url.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (err) {
      return callback(new Error('Not allowed by CORS'));
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'OK ✅ Server running' });
});

// Test route để kiểm tra authentication
app.get('/api/test-auth', authenticate, (req, res) => {
  res.status(200).json({
    message: 'Authentication working',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

// Public routes
app.use('/api/auth', route.authRoutes);
app.use('/api/cron', route.cronRoutes);
app.use('/api/medicine', route.medicineRoutes);
app.use('/api/import-inspections', route.importInspectionRoutes);
app.use('/api/notifications', route.notificationRoutes);
app.use('/api/thingsboard', route.thingsboardRoutes);
app.use('/api/batch', route.batchRoutes);
app.use('/api/packages', route.packageRoutes);
app.use('/api/areas', route.areaRoutes);
app.use('/api/locations', route.locationRoutes);
app.use('/api/log-location-changes', route.logLocationChangeRoute);

// Protected routes với role-based access
app.use('/api/supervisor', authenticate, authorize('supervisor'), route.supervisorRoutes);
app.use(
  '/api/inspections',
  authenticate,
  authorize(['warehouse', 'warehouse_manager']),
  route.inspectionRoutes,
);
app.use(
  '/api/users',
  authenticate,
  authorize([USER_ROLES.WAREHOUSEMANAGER, USER_ROLES.SUPERVISOR, USER_ROLES.REPRESENTATIVEMANAGER]),
  route.userRoutes,
);

app.use('/api/export-orders', authenticate, route.exportOrderRoutes);

// Protected routes với role-based access
app.use(
  '/api/accounts',
  authenticate,
  authorize(['supervisor', 'representative', 'representative_manager']),
  route.accountRoutes,
);

// Import orders - protected route
app.use('/api/import-orders', route.importOrderRoutes);
// app.use('/api/export-orders', route.exportOrderRoutes);
app.use('/api/stripe', route.stripeRoutes);
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/bills', route.billRoutes);
app.use('/api/supplier', route.supplierRoutes);
app.use('/api/retailer', route.retailerRoutes);
app.use('/api/contract', route.contractRoutes);
app.use('/api/inventory-check-inspections', route.inventoryCheckInspectionRoutes);
app.use('/api/inventory-check-orders', route.inventoryCheckOrderRoutes);
app.use('/api/inventory', route.inventoryRoutes);
app.use('/api/dashboard', route.dashboardRoutes);
app.use('/api/reports', route.reportRoutes);

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

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});
app.use(errorHandler);

module.exports = app;
