'use client';

// @mui
import { Typography, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { BarChart } from '@mui/x-charts/BarChart';

// @project
import MainCard from '@/components/MainCard';
import { fCurrency } from '@/utils/format-number';

// @assets
import { IconPackage } from '@tabler/icons-react';

/***************************   OVERVIEW CHART  ***************************/

export default function RepresentativeOverviewChart({ data }) {
  const theme = useTheme();

  // Calculate totals from API data
  const exportTotal = data?.export?.reduce((sum, item) => sum + item.count, 0) || 0;
  const importTotal = data?.import?.reduce((sum, item) => sum + item.count, 0) || 0;
  const exportValue = data?.export?.reduce((sum, item) => sum + item.value, 0) || 0;
  const importValue = data?.import?.reduce((sum, item) => sum + item.value, 0) || 0;

  // Prepare chart data
  const chartData = [];
  const months = new Set();
  
  // Collect all months
  data?.export?.forEach(item => months.add(item.month));
  data?.import?.forEach(item => months.add(item.month));
  
  // Sort months
  const sortedMonths = Array.from(months).sort();
  
  // Create chart data
  sortedMonths.forEach(month => {
    const exportItem = data?.export?.find(item => item.month === month);
    const importItem = data?.import?.find(item => item.month === month);
    
    chartData.push({
      month: month,
      'Export Orders': exportItem?.count || 0,
      'Import Orders': importItem?.count || 0,
    });
  });

  // If no data, show placeholder
  if (chartData.length === 0) {
    return (
      <MainCard>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconPackage size={24} />
          <Box>
            <Typography variant="h6">Export vs Import Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly comparison of export and import orders
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
              Export: {exportTotal} orders ({fCurrency(exportValue)})
            </Typography>
            <Typography sx={{ fontSize: '14px', color: 'text.secondary' }}>
              Import: {importTotal} orders ({fCurrency(importValue)})
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
          <Typography variant="h6">Export vs Import Orders</Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly comparison of export and import orders
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ height: '300px', width: '100%' }}>
        <BarChart
          dataset={chartData}
          xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
          series={[
            { dataKey: 'Export Orders', color: theme.palette.primary.main },
            { dataKey: 'Import Orders', color: theme.palette.secondary.main }
          ]}
          height={300}
          margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
      </Box>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <Box>
          <Typography variant="h6" color="primary.main">
            {exportTotal}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Export Orders
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fCurrency(exportValue)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="secondary.main">
            {importTotal}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Import Orders
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {fCurrency(importValue)}
          </Typography>
        </Box>
      </Box>
    </MainCard>
  );
}

RepresentativeOverviewChart.propTypes = {
  data: PropTypes.shape({
    export: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string,
      count: PropTypes.number,
      value: PropTypes.number
    })),
    import: PropTypes.arrayOf(PropTypes.shape({
      month: PropTypes.string,
      count: PropTypes.number,
      value: PropTypes.number
    }))
  })
}; 