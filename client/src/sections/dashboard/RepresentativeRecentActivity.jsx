'use client';

// @mui
import { Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';

// @project
import MainCard from '@/components/MainCard';
import { fCurrency } from '@/utils/format-number';

// @assets
import { IconPackage } from '@tabler/icons-react';

/***************************   RECENT ACTIVITY  ***************************/

export default function RepresentativeRecentActivity({ data }) {
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainCard>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconPackage size={24} />
        <Box>
          <Typography variant="h6">Recent Activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Latest export orders
          </Typography>
        </Box>
      </Box>

      {!data || data.length === 0 ? (
        <Box sx={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="text.secondary">No recent activity</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order Code</TableCell>
                <TableCell>Contract</TableCell>
                <TableCell>Representative</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((activity) => (
                <TableRow key={activity.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {activity.orderCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {activity.contractCode || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {activity.representative || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={activity.status} color={getStatusColor(activity.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="medium">
                      {fCurrency(activity.totalValue)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(activity.createdAt)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </MainCard>
  );
}

RepresentativeRecentActivity.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      orderCode: PropTypes.string,
      contractCode: PropTypes.string,
      warehouseManager: PropTypes.string,
      representative: PropTypes.string,
      status: PropTypes.string,
      totalValue: PropTypes.number,
      createdAt: PropTypes.string
    })
  )
};
