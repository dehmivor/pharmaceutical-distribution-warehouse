'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import useTrans from '@/hooks/useTrans';

const ImportOrderDetails = ({ order, onClose }) => {
  const trans = useTrans();
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
    return <Typography>{trans.common.loading}</Typography>;
  }

  const orderDetails = orderData?.data;

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {/* Order Information */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {trans.common.orderInformation}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.orderCode}
          </Typography>
          <Typography variant="body1">{orderDetails.import_order_code}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.contract}
          </Typography>
          <Typography variant="body1">{orderDetails.contract_id.contract_code}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.supplier}
          </Typography>
          <Typography variant="body1">{orderDetails.supplier_id.full_name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.warehouse}
          </Typography>
          <Typography variant="body1">{orderDetails.warehouse_id.full_name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.importDate}
          </Typography>
          <Typography variant="body1">{new Date(orderDetails.import_date).toLocaleDateString()}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.totalValue}
          </Typography>
          <Typography variant="body1">
            {orderDetails.total_value.toLocaleString()} {trans.common.currency}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.status}
          </Typography>
          <Typography variant="body1">{orderDetails.status}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            {trans.common.createdBy}
          </Typography>
          <Typography variant="body1">{orderDetails.created_by.full_name}</Typography>
        </Grid>
        {orderDetails.approved_by && (
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              {trans.common.approvedBy}
            </Typography>
            <Typography variant="body1">{orderDetails.approved_by.full_name}</Typography>
          </Grid>
        )}

        {/* Order Details */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            {trans.common.orderDetailsTitle}
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{trans.common.medicine}</TableCell>
                  <TableCell>{trans.common.batch}</TableCell>
                  <TableCell>{trans.common.quantity}</TableCell>
                  <TableCell>{trans.common.unitPrice}</TableCell>
                  <TableCell>{trans.common.total}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderDetails.details.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{detail.medicine_id.name}</TableCell>
                    <TableCell>{detail.batch_id.batch_code}</TableCell>
                    <TableCell>{detail.quantity}</TableCell>
                    <TableCell>
                      {detail.unit_price.toLocaleString()} {trans.common.currency}
                    </TableCell>
                    <TableCell>
                      {(detail.quantity * detail.unit_price).toLocaleString()} {trans.common.currency}
                    </TableCell>
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
              {trans.common.close}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ImportOrderDetails;
