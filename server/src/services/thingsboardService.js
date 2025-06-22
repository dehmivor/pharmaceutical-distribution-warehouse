// server/src/services/thingsboard.service.js
const fetch = require('node-fetch');

class ThingsboardService {
  constructor() {
    this.baseUrl = process.env.THINGSBOARD_URL || 'https://demo.thingsboard.io';
    this.token = null;
    this.refreshToken = null;
  }

  async authenticate() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: process.env.THINGSBOARD_USERNAME,
          password: process.env.THINGSBOARD_PASSWORD,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;
      this.refreshToken = data.refreshToken;

      return data;
    } catch (error) {
      console.error('ThingsBoard authentication error:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, options = {}) {
    if (!this.token) {
      await this.authenticate();
    }

    const url = `${this.baseUrl}/api${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken();
          config.headers['X-Authorization'] = `Bearer ${this.token}`;
          const retryResponse = await fetch(url, config);
          if (!retryResponse.ok) {
            throw new Error(`API request failed: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        }
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('ThingsBoard API error:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.refreshToken = data.refreshToken;

      return data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  // Device operations
  async getDevices(pageSize = 10, page = 0, textSearch = '') {
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      page: page.toString(),
      sortProperty: 'name',
      sortOrder: 'ASC',
    });

    if (textSearch) {
      params.append('textSearch', textSearch);
    }

    return this.makeRequest(`/tenant/devices?${params}`);
  }

  async getDevice(deviceId) {
    return this.makeRequest(`/device/${deviceId}`);
  }

  async createDevice(deviceData) {
    return this.makeRequest('/device', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async updateDevice(deviceId, deviceData) {
    return this.makeRequest(`/device/${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
  }

  async deleteDevice(deviceId) {
    return this.makeRequest(`/device/${deviceId}`, {
      method: 'DELETE',
    });
  }

  // Telemetry operations
  async getTimeseries(
    entityType,
    entityId,
    keys,
    startTs,
    endTs,
    interval = 0,
    limit = 100,
    agg = 'NONE',
  ) {
    const params = new URLSearchParams({
      keys: Array.isArray(keys) ? keys.join(',') : keys,
      startTs: startTs.toString(),
      endTs: endTs.toString(),
      interval: interval.toString(),
      limit: limit.toString(),
      agg,
    });

    return this.makeRequest(
      `/plugins/telemetry/${entityType}/${entityId}/values/timeseries?${params}`,
    );
  }

  async getLatestTimeseries(entityType, entityId, keys) {
    const keysParam = Array.isArray(keys) ? keys.join(',') : keys;
    return this.makeRequest(
      `/plugins/telemetry/${entityType}/${entityId}/values/timeseries?keys=${keysParam}`,
    );
  }

  async getAttributes(entityType, entityId, keys) {
    const keysParam = Array.isArray(keys) ? keys.join(',') : keys;
    return this.makeRequest(
      `/plugins/telemetry/${entityType}/${entityId}/values/attributes?keys=${keysParam}`,
    );
  }

  async sendTelemetry(deviceId, telemetryData) {
    return this.makeRequest(`/plugins/telemetry/DEVICE/${deviceId}/timeseries/ANY`, {
      method: 'POST',
      body: JSON.stringify(telemetryData),
    });
  }

  // Dashboard operations
  async getDashboards(pageSize = 10, page = 0, textSearch = '') {
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      page: page.toString(),
      sortProperty: 'title',
      sortOrder: 'ASC',
    });

    if (textSearch) {
      params.append('textSearch', textSearch);
    }

    return this.makeRequest(`/tenant/dashboards?${params}`);
  }

  async getDashboard(dashboardId) {
    return this.makeRequest(`/dashboard/${dashboardId}`);
  }

  // Asset operations
  async getAssets(pageSize = 10, page = 0, textSearch = '') {
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      page: page.toString(),
      sortProperty: 'name',
      sortOrder: 'ASC',
    });

    if (textSearch) {
      params.append('textSearch', textSearch);
    }

    return this.makeRequest(`/tenant/assets?${params}`);
  }

  async createAsset(assetData) {
    return this.makeRequest('/asset', {
      method: 'POST',
      body: JSON.stringify(assetData),
    });
  }

  // Customer operations
  async getCustomers(pageSize = 10, page = 0, textSearch = '') {
    const params = new URLSearchParams({
      pageSize: pageSize.toString(),
      page: page.toString(),
      sortProperty: 'title',
      sortOrder: 'ASC',
    });

    if (textSearch) {
      params.append('textSearch', textSearch);
    }

    return this.makeRequest(`/customers?${params}`);
  }

  async createCustomer(customerData) {
    return this.makeRequest('/customer', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }
}

module.exports = new ThingsboardService();
