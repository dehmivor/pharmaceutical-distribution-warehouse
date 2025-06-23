// server/src/routes/thingsboard.routes.js
const express = require('express');
const router = express.Router();
const ThingsBoardController = require('../controllers/thingsboardController');

// Device routes
router.get('/devices', ThingsBoardController.getDevices);
router.get('/devices/:deviceId', ThingsBoardController.getDevice);
router.post('/devices', ThingsBoardController.createDevice);
router.put('/devices/:deviceId', ThingsBoardController.updateDevice);
router.delete('/devices/:deviceId', ThingsBoardController.deleteDevice);

// Telemetry routes
router.get('/telemetry/:entityType/:entityId/timeseries', ThingsBoardController.getTimeseries);
router.get('/telemetry/:entityType/:entityId/latest', ThingsBoardController.getLatestTimeseries);
router.get('/telemetry/:entityType/:entityId/attributes', ThingsBoardController.getAttributes);
router.post('/telemetry/devices/:deviceId', ThingsBoardController.sendTelemetry);

// Dashboard routes
router.get('/dashboards', ThingsBoardController.getDashboards);
router.get('/dashboards/:dashboardId', ThingsBoardController.getDashboard);

// Asset routes
router.get('/assets', ThingsBoardController.getAssets);
router.post('/assets', ThingsBoardController.createAsset);

// Customer routes
router.get('/customers', ThingsBoardController.getCustomers);
router.post('/customers', ThingsBoardController.createCustomer);

module.exports = router;
