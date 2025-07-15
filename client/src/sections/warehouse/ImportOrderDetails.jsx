'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';

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

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Order Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Order Information
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Order Code
          </Typography>
          <Typography variant="body1">{orderDetails.import_order_code}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Contract
          </Typography>
          <Typography variant="body1">{orderDetails.contract_id.contract_code}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Supplier
          </Typography>
          <Typography variant="body1">{orderDetails.supplier_id.full_name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Warehouse
          </Typography>
          <Typography variant="body1">{orderDetails.warehouse_id.full_name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Import Date
          </Typography>
          <Typography variant="body1">{new Date(orderDetails.import_date).toLocaleDateString()}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Value
          </Typography>
          <Typography variant="body1">{orderDetails.total_value.toLocaleString()} VND</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Status
          </Typography>
          <Typography variant="body1">{orderDetails.status}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Created By
          </Typography>
          <Typography variant="body1">{orderDetails.created_by.full_name}</Typography>
        </Grid>
        {orderDetails.approved_by && (
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Approved By
            </Typography>
            <Typography variant="body1">{orderDetails.approved_by.full_name}</Typography>
          </Grid>
        )}

        {/* Order Details */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Order Details
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Medicine</TableCell>
                  <TableCell>Batch</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.details.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{detail.medicine_id.name}</TableCell>
                    <TableCell>{detail.batch_id.batch_code}</TableCell>
                    <TableCell>{detail.quantity}</TableCell>
                    <TableCell>{detail.unit_price.toLocaleString()} VND</TableCell>
                    <TableCell>{(detail.quantity * detail.unit_price).toLocaleString()} VND</TableCell>
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
