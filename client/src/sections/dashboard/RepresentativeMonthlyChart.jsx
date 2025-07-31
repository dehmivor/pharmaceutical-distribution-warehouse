'use client';

// @mui
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { LineChart } from '@mui/x-charts/LineChart';

// @project
import MainCard from '@/components/MainCard';
import { fCurrency } from '@/utils/format-number';

// @assets
import { IconPackage } from '@tabler/icons-react';

/***************************   MONTHLY CHART  ***************************/

export default function RepresentativeMonthlyChart({ data }) {
  const theme = useTheme();

  // Calculate totals from API data
  const totalOrders = data?.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalValue = data?.reduce((sum, item) => sum + item.value, 0) || 0;
  const averageOrders = data?.length ? Math.round(totalOrders / data.length) : 0;

  // Prepare chart data
  const chartData = data?.map(item => ({
    month: item.month,
    'Orders': item.count,
    'Value': item.value
  })) || [];

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <MainCard>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconPackage size={24} />
          <Box>
            <Typography variant="h6">Monthly Export Orders Trend</Typography>
            <Typography variant="body2" color="text.secondary">
              Export orders trend over time
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <IconPackage size={48} color={theme.palette.primary.main} />
            <Typography sx={{ mt: 2, color: 'text.secondary' }}>
              No data available for chart
            </Typography>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary', mt: 1 }}>
              Total: {totalOrders} orders ({fCurrency(totalValue)})
            </Typography>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
              Average: {averageOrders} orders/month
            </Typography>
          </Box>
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconPackage size={24} />
        <Box>
          <Typography variant="h6">Monthly Export Orders Trend</Typography>
          <Typography variant="body2" color="text.secondary">
            Export orders trend over time
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ height: '300px', width: '100%' }}>
        <LineChart
          dataset={chartData}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { 
              dataKey: 'Orders', 
              color: theme.palette.primary.main,
              area: true,
              areaOpacity: 0.1
            }
          ]}
          height={300}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <Box>
          <Typography variant="h6" color="primary.main">
            {totalOrders}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Orders
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="secondary.main">
            {averageOrders}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Average/Month
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="info.main">
            {fCurrency(totalValue)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Value
          </Typography>
        </Box>
      </Box>
    </MainCard>
  );
}

RepresentativeMonthlyChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    month: PropTypes.string,
    count: PropTypes.number,
    value: PropTypes.number
  }))
}; 