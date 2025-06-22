'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Button,
  CircularProgress,
  Chip,
  Paper,
  AlertTitle
} from '@mui/material';
// Import icons đúng cách từ @mui/icons-material
import ThermostatIcon from '@mui/icons-material/Thermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import SpeedIcon from '@mui/icons-material/Speed';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WarningIcon from '@mui/icons-material/Warning';
// Import Recharts components đúng cách
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useThingsBoardDevices, useDeviceTelemetry, useLatestTelemetry, useThingsBoardMutations } from '@/hooks/useThingsBoard';

const WarehouseMonitoring = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  const { devices, isLoading: devicesLoading, isError: devicesError } = useThingsBoardDevices();

  const { telemetryData, isLoading: telemetryLoading } = useDeviceTelemetry(selectedDeviceId, ['temperature', 'humidity', 'pressure'], 24);

  const { latestData } = useLatestTelemetry(selectedDeviceId, ['temperature', 'humidity', 'pressure']);

  const { sendTelemetry, loading: sendingTelemetry } = useThingsBoardMutations();

  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      const firstDevice = devices[0];
      setSelectedDeviceId(firstDevice.id.id);
      setSelectedDevice(firstDevice);
    }
  }, [devices, selectedDeviceId]);

  const handleDeviceChange = (event) => {
    const deviceId = event.target.value;
    const device = devices.find((d) => d.id.id === deviceId);
    setSelectedDeviceId(deviceId);
    setSelectedDevice(device);
  };

  const getCurrentValue = (key) => {
    if (latestData[key] && latestData[key].length > 0) {
      return parseFloat(latestData[key][0].value);
    }
    return null;
  };

  const prepareChartData = (key) => {
    const data = telemetryData[key] || [];
    return data.map((item) => ({
      timestamp: format(new Date(item.ts), 'HH:mm'),
      value: parseFloat(item.value),
      fullTime: format(new Date(item.ts), 'yyyy-MM-dd HH:mm:ss')
    }));
  };

  const checkAlerts = () => {
    const alerts = [];
    const currentTemp = getCurrentValue('temperature');
    const currentHumidity = getCurrentValue('humidity');

    if (currentTemp !== null) {
      if (currentTemp < 2 || currentTemp > 8) {
        alerts.push({
          type: 'error',
          message: `Temperature critical: ${currentTemp.toFixed(1)}°C (Required: 2-8°C for pharmaceuticals)`,
          icon: <ThermostatIcon />
        });
      }
    }

    if (currentHumidity !== null) {
      if (currentHumidity < 45 || currentHumidity > 65) {
        alerts.push({
          type: 'warning',
          message: `Humidity out of range: ${currentHumidity.toFixed(1)}% (Recommended: 45-65%)`,
          icon: <OpacityIcon />
        });
      }
    }

    return alerts;
  };

  const handleSendTestData = async () => {
    if (!selectedDeviceId) return;

    try {
      await sendTelemetry(selectedDeviceId, {
        temperature: (Math.random() * 10 + 2).toFixed(2),
        humidity: (Math.random() * 20 + 45).toFixed(2),
        pressure: (Math.random() * 50 + 1000).toFixed(2),
        ts: Date.now()
      });
    } catch (error) {
      console.error('Failed to send test data:', error);
    }
  };

  const alerts = checkAlerts();

  if (devicesError) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Connection Error</AlertTitle>
            Failed to connect to ThingsBoard. Please check your configuration.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              Warehouse Environmental Monitoring
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="contained"
                onClick={handleSendTestData}
                disabled={!selectedDeviceId || sendingTelemetry}
                startIcon={sendingTelemetry ? <CircularProgress size={16} /> : null}
              >
                {sendingTelemetry ? 'Sending...' : 'Send Test Data'}
              </Button>
              <Chip
                icon={devices.length > 0 ? <WifiIcon /> : <WifiOffIcon />}
                label={devices.length > 0 ? 'Connected' : 'Offline'}
                color={devices.length > 0 ? 'success' : 'error'}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Device Selector */}
          <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
            <InputLabel>Select Warehouse Device</InputLabel>
            <Select value={selectedDeviceId} label="Select Warehouse Device" onChange={handleDeviceChange} disabled={devicesLoading}>
              {devicesLoading ? (
                <MenuItem disabled>Loading devices...</MenuItem>
              ) : devices.length === 0 ? (
                <MenuItem disabled>No devices found</MenuItem>
              ) : (
                devices.map((device) => (
                  <MenuItem key={device.id.id} value={device.id.id}>
                    {device.name} ({device.type || 'Unknown'})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Current Values Display */}
          {selectedDevice && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                { key: 'temperature', icon: <ThermostatIcon />, unit: '°C', color: '#f44336' },
                { key: 'humidity', icon: <OpacityIcon />, unit: '%', color: '#2196f3' },
                { key: 'pressure', icon: <SpeedIcon />, unit: 'hPa', color: '#4caf50' }
              ].map(({ key, icon, unit, color }) => {
                const currentValue = getCurrentValue(key);
                return (
                  <Grid item xs={12} md={4} key={key}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                        <Box sx={{ color, mr: 1 }}>{icon}</Box>
                        <Typography variant="h6" component="h3">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Typography>
                      </Box>
                      <Typography variant="h3" component="div" sx={{ color }}>
                        {currentValue !== null ? (
                          <>
                            {currentValue.toFixed(1)}
                            <Typography variant="h6" component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                              {unit}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="h6" sx={{ color: 'text.disabled' }}>
                            --
                          </Typography>
                        )}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 1 }} />
                Active Alerts
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {alerts.map((alert, index) => (
                  <Alert key={index} severity={alert.type} icon={alert.icon}>
                    {alert.message}
                  </Alert>
                ))}
              </Box>
            </Box>
          )}

          {/* Charts Section */}
          {selectedDeviceId && (
            <Grid container spacing={3}>
              {['temperature', 'humidity'].map((key) => (
                <Grid item xs={12} lg={6} key={key}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {key.charAt(0).toUpperCase() + key.slice(1)} Trend (24h)
                      </Typography>

                      {telemetryLoading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                          <CircularProgress />
                        </Box>
                      ) : telemetryData[key] && telemetryData[key].length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={prepareChartData(key)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                            <YAxis domain={key === 'temperature' ? [0, 15] : [0, 100]} tick={{ fontSize: 12 }} />
                            <Tooltip
                              labelFormatter={(value, payload) => {
                                if (payload && payload[0]) {
                                  return payload[0].payload.fullTime;
                                }
                                return value;
                              }}
                              formatter={(value) => [
                                `${parseFloat(value).toFixed(2)}${key === 'temperature' ? '°C' : '%'}`,
                                key.charAt(0).toUpperCase() + key.slice(1)
                              ]}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={key === 'temperature' ? '#f44336' : '#2196f3'}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                              name={key.charAt(0).toUpperCase() + key.slice(1)}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                          <Typography variant="body1" color="text.secondary">
                            No data available for {key}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default WarehouseMonitoring;
