'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { TrendingUp as TrendingUpIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import useWarehouseManagerChart from '@/hooks/useWarehouseManagerChart';

const WarehouseManagerChart = ({ months = 6 }) => {
  const { chartData, loading, error, refreshChart } = useWarehouseManagerChart(months);
  const theme = useTheme();
  const [chartType, setChartType] = useState('count');
  const [chartWidth, setChartWidth] = useState(800);

  // Calculate chart width based on screen size
  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        setChartWidth(Math.max(800, window.innerWidth - 200));
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Orders Trend
            </Typography>
          </Box>
          <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Orders Trend
            </Typography>
          </Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="Refresh Chart">
              <IconButton onClick={refreshChart} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || !chartData.labels || chartData.labels.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Orders Trend
            </Typography>
          </Box>
          <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">No data available for chart</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // Prepare data for the chart
  const getChartData = () => {
    if (chartType === 'count') {
      return chartData.datasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.map((value, index) => ({
          x: index,
          y: value
        }))
      }));
    } else {
      return chartData.valueDatasets.map((dataset) => ({
        ...dataset,
        data: dataset.data.map((value, index) => ({
          x: index,
          y: value
        }))
      }));
    }
  };

  const currentData = getChartData();

  return (
    <Card sx={{ height: '100%', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ alignItems: 'end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 400 }}>
              Orders Trend
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.700' }}>
              Analyze import and export orders with real-time analytics.
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ToggleButtonGroup value={chartType} exclusive onChange={handleChartTypeChange} size="small">
              <ToggleButton value="count">Count</ToggleButton>
              <ToggleButton value="value">Value (VND)</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Refresh Chart">
              <IconButton onClick={refreshChart} color="primary" size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>

        <Box sx={{ height: '400px', width: '100%', overflow: 'auto' }}>
          <LineChart
            dataset={currentData}
            xAxis={[
              {
                data: chartData.labels.map((_, index) => index),
                valueFormatter: (index) => chartData.labels[index] || '',
                scaleType: 'point',
                tickLabelStyle: {
                  fontSize: 12,
                  fontWeight: 500
                }
              }
            ]}
            yAxis={[
              {
                scaleType: 'linear',
                valueFormatter: (value) => (chartType === 'value' ? `${(value / 1000000).toFixed(1)}M VND` : value.toString()),
                tickLabelStyle: {
                  fontSize: 12,
                  fontWeight: 500
                }
              }
            ]}
            series={currentData.map((dataset, index) => ({
              dataKey: `y`,
              label: dataset.label,
              color: dataset.borderColor,
              curve: 'linear',
              area: true,
              areaOpacity: 0.1,
              lineWidth: 3
            }))}
            height={400}
            width={chartWidth}
            margin={{ top: 20, bottom: 40, left: 60, right: 40 }}
          />
        </Box>

        <Stack sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
          {currentData.map((dataset, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: dataset.borderColor
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {dataset.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WarehouseManagerChart;
