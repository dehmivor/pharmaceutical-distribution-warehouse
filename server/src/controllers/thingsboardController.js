// server/src/controllers/thingsboard.controller.js
const ThingsBoardService = require('../services/thingsboardService');

class ThingsboardController {
  // ==================== DEVICE MANAGEMENT ====================

  /**
   * Get list of devices with pagination and search
   */
  async getDevices(req, res) {
    try {
      const { pageSize = 10, page = 0, textSearch = '' } = req.query;
      const devices = await ThingsBoardService.getDevices(
        parseInt(pageSize),
        parseInt(page),
        textSearch,
      );

      res.status(200).json({
        success: true,
        data: devices,
        message: 'Devices retrieved successfully',
      });
    } catch (error) {
      console.error('Get devices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve devices',
        error: error.message,
      });
    }
  }

  /**
   * Get single device by ID
   */
  async getDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const device = await ThingsBoardService.getDevice(deviceId);

      res.status(200).json({
        success: true,
        data: device,
        message: 'Device retrieved successfully',
      });
    } catch (error) {
      console.error('Get device error:', error);
      res.status(404).json({
        success: false,
        message: 'Device not found',
        error: error.message,
      });
    }
  }

  /**
   * Create new device
   */
  async createDevice(req, res) {
    try {
      const deviceData = {
        name: req.body.name,
        type: req.body.type || 'default',
        label: req.body.label || '',
        additionalInfo: req.body.additionalInfo || {},
      };

      const device = await ThingsBoardService.createDevice(deviceData);

      res.status(201).json({
        success: true,
        data: device,
        message: 'Device created successfully',
      });
    } catch (error) {
      console.error('Create device error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create device',
        error: error.message,
      });
    }
  }

  /**
   * Update device
   */
  async updateDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const deviceData = req.body;
      const device = await ThingsBoardService.updateDevice(deviceId, deviceData);

      res.status(200).json({
        success: true,
        data: device,
        message: 'Device updated successfully',
      });
    } catch (error) {
      console.error('Update device error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update device',
        error: error.message,
      });
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(req, res) {
    try {
      const { deviceId } = req.params;
      await ThingsBoardService.deleteDevice(deviceId);

      res.status(200).json({
        success: true,
        message: 'Device deleted successfully',
      });
    } catch (error) {
      console.error('Delete device error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to delete device',
        error: error.message,
      });
    }
  }

  /**
   * Get device credentials (access token)
   */
  async getDeviceCredentials(req, res) {
    try {
      const { deviceId } = req.params;
      const credentials = await ThingsBoardService.getDeviceCredentials(deviceId);

      res.status(200).json({
        success: true,
        data: credentials,
        message: 'Device credentials retrieved successfully',
      });
    } catch (error) {
      console.error('Get device credentials error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve device credentials',
        error: error.message,
      });
    }
  }

  // ==================== TELEMETRY MANAGEMENT ====================

  /**
   * Get historical telemetry data
   */
  async getTimeseries(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { keys, startTs, endTs, interval = 0, limit = 100, agg = 'NONE' } = req.query;

      if (!keys) {
        return res.status(400).json({
          success: false,
          message: 'Keys parameter is required',
        });
      }

      const telemetry = await ThingsBoardService.getTimeseries(
        entityType,
        entityId,
        keys.split(','),
        parseInt(startTs),
        parseInt(endTs),
        parseInt(interval),
        parseInt(limit),
        agg,
      );

      res.status(200).json({
        success: true,
        data: telemetry,
        message: 'Telemetry data retrieved successfully',
      });
    } catch (error) {
      console.error('Get timeseries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve telemetry data',
        error: error.message,
      });
    }
  }

  /**
   * Get latest telemetry data
   */
  async getLatestTimeseries(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { keys } = req.query;

      if (!keys) {
        return res.status(400).json({
          success: false,
          message: 'Keys parameter is required',
        });
      }

      const telemetry = await ThingsBoardService.getLatestTimeseries(
        entityType,
        entityId,
        keys.split(','),
      );

      res.status(200).json({
        success: true,
        data: telemetry,
        message: 'Latest telemetry data retrieved successfully',
      });
    } catch (error) {
      console.error('Get latest timeseries error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve latest telemetry data',
        error: error.message,
      });
    }
  }

  /**
   * Send telemetry data to device
   */
  async sendTelemetry(req, res) {
    try {
      const { deviceId } = req.params;
      const telemetryData = req.body;

      // Add timestamp if not provided
      if (!telemetryData.ts) {
        telemetryData.ts = Date.now();
      }

      const result = await ThingsBoardService.sendTelemetry(deviceId, telemetryData);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Telemetry data sent successfully',
      });
    } catch (error) {
      console.error('Send telemetry error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to send telemetry data',
        error: error.message,
      });
    }
  }

  // ==================== ATTRIBUTES MANAGEMENT ====================

  /**
   * Get entity attributes
   */
  async getAttributes(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { keys, scope = 'SERVER_SCOPE' } = req.query;

      const attributes = await ThingsBoardService.getAttributes(
        entityType,
        entityId,
        keys ? keys.split(',') : undefined,
        scope,
      );

      res.status(200).json({
        success: true,
        data: attributes,
        message: 'Attributes retrieved successfully',
      });
    } catch (error) {
      console.error('Get attributes error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attributes',
        error: error.message,
      });
    }
  }

  /**
   * Save entity attributes
   */
  async saveAttributes(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { scope = 'SERVER_SCOPE' } = req.query;
      const attributes = req.body;

      const result = await ThingsBoardService.saveAttributes(
        entityType,
        entityId,
        attributes,
        scope,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Attributes saved successfully',
      });
    } catch (error) {
      console.error('Save attributes error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to save attributes',
        error: error.message,
      });
    }
  }

  /**
   * Delete entity attributes
   */
  async deleteAttributes(req, res) {
    try {
      const { entityType, entityId } = req.params;
      const { keys, scope = 'SERVER_SCOPE' } = req.query;

      if (!keys) {
        return res.status(400).json({
          success: false,
          message: 'Keys parameter is required',
        });
      }

      const result = await ThingsBoardService.deleteAttributes(
        entityType,
        entityId,
        keys.split(','),
        scope,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Attributes deleted successfully',
      });
    } catch (error) {
      console.error('Delete attributes error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to delete attributes',
        error: error.message,
      });
    }
  }

  // ==================== RPC MANAGEMENT ====================

  /**
   * Send RPC command to device
   */
  async sendRpcCommand(req, res) {
    try {
      const { deviceId } = req.params;
      const { method, params = {}, timeout = 60000 } = req.body;

      if (!method) {
        return res.status(400).json({
          success: false,
          message: 'Method parameter is required',
        });
      }

      const result = await ThingsBoardService.sendRpcCommand(deviceId, { method, params }, timeout);

      res.status(200).json({
        success: true,
        data: result,
        message: 'RPC command sent successfully',
      });
    } catch (error) {
      console.error('Send RPC command error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to send RPC command',
        error: error.message,
      });
    }
  }

  /**
   * Get RPC requests for device
   */
  async getRpcRequests(req, res) {
    try {
      const { deviceId } = req.params;
      const { pageSize = 10, page = 0 } = req.query;

      const rpcRequests = await ThingsBoardService.getRpcRequests(
        deviceId,
        parseInt(pageSize),
        parseInt(page),
      );

      res.status(200).json({
        success: true,
        data: rpcRequests,
        message: 'RPC requests retrieved successfully',
      });
    } catch (error) {
      console.error('Get RPC requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve RPC requests',
        error: error.message,
      });
    }
  }

  // ==================== DASHBOARD MANAGEMENT ====================

  /**
   * Get dashboards with pagination
   */
  async getDashboards(req, res) {
    try {
      const { pageSize = 10, page = 0, textSearch = '' } = req.query;
      const dashboards = await ThingsBoardService.getDashboards(
        parseInt(pageSize),
        parseInt(page),
        textSearch,
      );

      res.status(200).json({
        success: true,
        data: dashboards,
        message: 'Dashboards retrieved successfully',
      });
    } catch (error) {
      console.error('Get dashboards error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboards',
        error: error.message,
      });
    }
  }

  /**
   * Get single dashboard
   */
  async getDashboard(req, res) {
    try {
      const { dashboardId } = req.params;
      const dashboard = await ThingsBoardService.getDashboard(dashboardId);

      res.status(200).json({
        success: true,
        data: dashboard,
        message: 'Dashboard retrieved successfully',
      });
    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(404).json({
        success: false,
        message: 'Dashboard not found',
        error: error.message,
      });
    }
  }

  /**
   * Create new dashboard
   */
  async createDashboard(req, res) {
    try {
      const dashboardData = req.body;
      const dashboard = await ThingsBoardService.createDashboard(dashboardData);

      res.status(201).json({
        success: true,
        data: dashboard,
        message: 'Dashboard created successfully',
      });
    } catch (error) {
      console.error('Create dashboard error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create dashboard',
        error: error.message,
      });
    }
  }

  // ==================== ASSET MANAGEMENT ====================

  /**
   * Get assets with pagination
   */
  async getAssets(req, res) {
    try {
      const { pageSize = 10, page = 0, textSearch = '' } = req.query;
      const assets = await ThingsBoardService.getAssets(
        parseInt(pageSize),
        parseInt(page),
        textSearch,
      );

      res.status(200).json({
        success: true,
        data: assets,
        message: 'Assets retrieved successfully',
      });
    } catch (error) {
      console.error('Get assets error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve assets',
        error: error.message,
      });
    }
  }

  /**
   * Create new asset
   */
  async createAsset(req, res) {
    try {
      const assetData = req.body;
      const asset = await ThingsBoardService.createAsset(assetData);

      res.status(201).json({
        success: true,
        data: asset,
        message: 'Asset created successfully',
      });
    } catch (error) {
      console.error('Create asset error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create asset',
        error: error.message,
      });
    }
  }

  // ==================== CUSTOMER MANAGEMENT ====================

  /**
   * Get customers with pagination
   */
  async getCustomers(req, res) {
    try {
      const { pageSize = 10, page = 0, textSearch = '' } = req.query;
      const customers = await ThingsBoardService.getCustomers(
        parseInt(pageSize),
        parseInt(page),
        textSearch,
      );

      res.status(200).json({
        success: true,
        data: customers,
        message: 'Customers retrieved successfully',
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve customers',
        error: error.message,
      });
    }
  }

  /**
   * Create new customer
   */
  async createCustomer(req, res) {
    try {
      const customerData = req.body;
      const customer = await ThingsBoardService.createCustomer(customerData);

      res.status(201).json({
        success: true,
        data: customer,
        message: 'Customer created successfully',
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create customer',
        error: error.message,
      });
    }
  }

  // ==================== WAREHOUSE SPECIFIC FUNCTIONS ====================

  /**
   * Get warehouse environmental conditions
   */
  async getWarehouseConditions(req, res) {
    try {
      // Get all warehouse devices
      const devices = await ThingsBoardService.getDevices(50, 0, 'warehouse');
      const conditions = {};

      for (const device of devices.data || []) {
        try {
          // Get latest telemetry for each device
          const telemetry = await ThingsBoardService.getLatestTimeseries('DEVICE', device.id.id, [
            'temperature',
            'humidity',
            'pressure',
          ]);

          conditions[device.name] = {
            device: device,
            telemetry: telemetry,
            status: 'online',
          };
        } catch (error) {
          conditions[device.name] = {
            device: device,
            telemetry: {},
            status: 'offline',
            error: error.message,
          };
        }
      }

      res.status(200).json({
        success: true,
        data: conditions,
        message: 'Warehouse conditions retrieved successfully',
      });
    } catch (error) {
      console.error('Get warehouse conditions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve warehouse conditions',
        error: error.message,
      });
    }
  }

  /**
   * Check warehouse alerts
   */
  async getWarehouseAlerts(req, res) {
    try {
      const devices = await ThingsBoardService.getDevices(50, 0, 'warehouse');
      const alerts = [];

      for (const device of devices.data || []) {
        try {
          const telemetry = await ThingsBoardService.getLatestTimeseries('DEVICE', device.id.id, [
            'temperature',
            'humidity',
          ]);

          // Check temperature alerts (pharmaceutical storage: 2-8°C)
          if (telemetry.temperature && telemetry.temperature.length > 0) {
            const temp = parseFloat(telemetry.temperature[0].value);
            if (temp < 2 || temp > 8) {
              alerts.push({
                deviceId: device.id.id,
                deviceName: device.name,
                type: 'temperature',
                severity: 'high',
                value: temp,
                message: `Temperature out of range: ${temp}°C (Required: 2-8°C)`,
                timestamp: telemetry.temperature[0].ts,
              });
            }
          }

          // Check humidity alerts (45-65%)
          if (telemetry.humidity && telemetry.humidity.length > 0) {
            const humidity = parseFloat(telemetry.humidity[0].value);
            if (humidity < 45 || humidity > 65) {
              alerts.push({
                deviceId: device.id.id,
                deviceName: device.name,
                type: 'humidity',
                severity: 'medium',
                value: humidity,
                message: `Humidity out of range: ${humidity}% (Recommended: 45-65%)`,
                timestamp: telemetry.humidity[0].ts,
              });
            }
          }
        } catch (error) {
          alerts.push({
            deviceId: device.id.id,
            deviceName: device.name,
            type: 'connection',
            severity: 'low',
            message: `Device connection error: ${error.message}`,
            timestamp: Date.now(),
          });
        }
      }

      res.status(200).json({
        success: true,
        data: alerts,
        message: 'Warehouse alerts retrieved successfully',
      });
    } catch (error) {
      console.error('Get warehouse alerts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve warehouse alerts',
        error: error.message,
      });
    }
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const health = await ThingsBoardService.healthCheck();

      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          thingsboard: health,
        },
        message: 'ThingsBoard service is healthy',
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        message: 'ThingsBoard service is unhealthy',
        error: error.message,
      });
    }
  }
}

module.exports = new ThingsboardController();
