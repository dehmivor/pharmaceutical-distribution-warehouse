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

/***************************   OVERVIEW CHART  ***************************/

export default function RepresentativeOverviewChart({ data }) {
  const theme = useTheme();

  // Calculate totals from API data
  const exportTotal = data?.export?.reduce((sum, item) => sum + item.count, 0) || 0;
  const importTotal = data?.import?.reduce((sum, item) => sum + item.count, 0) || 0;
  const exportValue = data?.export?.reduce((sum, item) => sum + item.value, 0) || 0;
  const importValue = data?.import?.reduce((sum, item) => sum + item.value, 0) || 0;

  // Prepare chart data with Date objects
  const chartData = [];
  
  // Only process if we have valid data
  if (data && Array.isArray(data.export) && Array.isArray(data.import)) {
    const months = new Set();
    
    // Collect all months
    data.export.forEach(item => {
      if (item && item.month) months.add(item.month);
    });
    data.import.forEach(item => {
      if (item && item.month) months.add(item.month);
    });
    
    // Sort months and convert to Date objects
    const sortedMonths = Array.from(months).sort();
    
    // Create chart data with Date objects
    sortedMonths.forEach(monthStr => {
      const [year, month] = monthStr.split('-').map(Number);
      const date = new Date(year, month - 1, 1); // month - 1 because Date constructor uses 0-based months
      
      const exportItem = data.export.find(item => item && item.month === monthStr);
      const importItem = data.import.find(item => item && item.month === monthStr);
      
      chartData.push({
        date: date,
        'Export Orders': Number(exportItem?.count || 0),
        'Import Orders': Number(importItem?.count || 0),
      });
    });
  }

  // If no data or invalid data, show placeholder
  if (!data || !Array.isArray(data.export) || !Array.isArray(data.import) || chartData.length === 0) {
    return (
      <MainCard>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconPackage size={24} />
          <Box>
            <Typography variant="h6">Export vs Import Orders</Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly comparison of all representatives
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
            Monthly comparison of all representatives
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ height: '300px', width: '100%' }}>
                           <LineChart
                     dataset={chartData.length > 0 ? chartData : [{ date: new Date(), 'Export Orders': 0, 'Import Orders': 0 }]}
                     xAxis={[{ 
                       dataKey: 'date', 
                       scaleType: 'point',
                       valueFormatter: (date) => date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                     }]}
                     series={[
                       { 
                         dataKey: 'Export Orders', 
                         color: theme.palette.primary.main,
                         area: true,
                         areaOpacity: 0.2,
                         curve: 'linear'
                       },
                       { 
                         dataKey: 'Import Orders', 
                         color: theme.palette.secondary.main,
                         area: true,
                         areaOpacity: 0.2,
                         curve: 'linear'
                       }
                     ]}
                     height={300}
                     margin={{ top: 20, bottom: 40, left: 50, right: 20 }}
                     grid={{ horizontal: true }}
                     slotProps={{ legend: { hidden: true } }}
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