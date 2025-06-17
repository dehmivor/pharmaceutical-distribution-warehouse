'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';

const ImportOrderDetails = ({ order, onClose }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/import-orders/${order._id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        const data = await response.json();
        setOrderData(data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [order._id]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  const orderDetails = orderData?.data;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Order Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Order Information
          </Typography>
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Manager
                </Typography>
                <Typography variant="body1">
                  {orderDetails.manager_id?.full_name || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Import Date
                </Typography>
                <Typography variant="body1">
                  {format(new Date(orderDetails.import_date), 'dd/MM/yyyy')}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Purchase Order
                </Typography>
                <Typography variant="body1">
                  {orderDetails.purchase_order_id?.code || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={orderDetails.status}
                  color={getStatusColor(orderDetails.status)}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Import Content */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Import Content
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Batch</TableCell>
                  <TableCell>Arrival Number</TableCell>
                  <TableCell>Rejected Number</TableCell>
                  <TableCell>Rejected Reason</TableCell>
                  <TableCell>Created By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.import_content.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.batch_id?.code || 'N/A'}</TableCell>
                    <TableCell>{item.arrival_number}</TableCell>
                    <TableCell>{item.rejected_number}</TableCell>
                    <TableCell>
                      {item.rejected_number > 0 ? item.rejected_reason : 'N/A'}
                    </TableCell>
                    <TableCell>{item.created_by || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Close Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImportOrderDetails; 