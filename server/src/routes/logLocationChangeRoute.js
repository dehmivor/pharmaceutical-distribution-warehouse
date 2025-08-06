const express = require('express');
const router = express.Router();
const logLocationChangeController = require('../controllers/logLocationChangeController');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Apply authentication middleware to all routes
router.use(authenticate);



// Get all location log
router.get(
  '/',
  authorize([
    'supervisor'
  ]),
  logLocationChangeController.getLogLocationChanges,
);

module.exports = router;
