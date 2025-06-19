"use client";
import React from 'react';
import { DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';

export default function PurchaseOrderDetail({ order, onClose }) {
  if (!order) return null;
  return (
    <>
      <DialogTitle>Chi tiết Purchase Order</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography><b>Mã đơn:</b> {order._id}</Typography>
          <Typography><b>Người tạo:</b> {order.created_by?.name || order.created_by?._id}</Typography>
          <Typography><b>Trạng thái:</b> {order.status}</Typography>
          <Typography><b>Ngày tạo:</b> {new Date(order.createdAt).toLocaleString()}</Typography>
          <Typography><b>Contract ID:</b> {order.contract_id?._id || order.contract_id}</Typography>
          <Typography><b>Order List:</b> {(order.order_list || []).map(m => m.name || m._id).join(', ')}</Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </>
  );
} 