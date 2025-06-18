'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  TextField,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Visibility as ViewIcon, Send as SendIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';

function ReceiptList({ onReceiptSelect, onSendForApproval }) {
  const [receipts, setReceipts] = useState([
    {
      id: 'PN001',
      date: '2024-01-15',
      orderId: 'DH001',
      supplier: 'Công ty ABC',
      totalItems: 3,
      totalValue: 125000000,
      status: 'draft',
      receivedUnits: 800,
      returnedUnits: 0,
      receivedPercentage: 100,
      createdBy: 'Nguyễn Văn A'
    },
    {
      id: 'PN002',
      date: '2024-01-14',
      orderId: 'DH002',
      supplier: 'Công ty XYZ',
      totalItems: 5,
      totalValue: 85000000,
      status: 'pending_approval',
      receivedUnits: 450,
      returnedUnits: 50,
      receivedPercentage: 90,
      createdBy: 'Trần Thị B'
    },
    {
      id: 'PN003',
      date: '2024-01-13',
      orderId: 'DH003',
      supplier: 'Công ty DEF',
      totalItems: 2,
      totalValue: 65000000,
      status: 'approved',
      receivedUnits: 300,
      returnedUnits: 0,
      receivedPercentage: 100,
      createdBy: 'Lê Văn C'
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'pending_approval':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft':
        return 'Nháp';
      case 'pending_approval':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      default:
        return status;
    }
  };

  const filteredReceipts = receipts.filter((receipt) => filterStatus === 'all' || receipt.status === filterStatus);

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setViewDialogOpen(true);
  };

  const handleSendForApproval = (receiptId) => {
    setReceipts((prev) => prev.map((receipt) => (receipt.id === receiptId ? { ...receipt, status: 'pending_approval' } : receipt)));
    onSendForApproval && onSendForApproval(receiptId);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Danh Sách Đơn Mua
        </Typography>

        {/* Filter */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Lọc theo trạng thái"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="all">Tất cả</option>
              <option value="draft">Nháp</option>
              <option value="pending_approval">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
            </TextField>
          </Grid>
        </Grid>

        {/* Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Số phiếu</TableCell>
                <TableCell>Ngày</TableCell>
                <TableCell>Đơn hàng</TableCell>
                <TableCell>Nhà cung cấp</TableCell>
                <TableCell>Tổng giá trị</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Thống kê</TableCell>
                <TableCell>Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{receipt.id}</TableCell>
                  <TableCell>{receipt.date}</TableCell>
                  <TableCell>{receipt.orderId}</TableCell>
                  <TableCell>{receipt.supplier}</TableCell>
                  <TableCell>{receipt.totalValue.toLocaleString()} VNĐ</TableCell>
                  <TableCell>
                    <Chip label={getStatusText(receipt.status)} color={getStatusColor(receipt.status)} size="small" />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="caption" display="block">
                        Nhận: {receipt.receivedUnits} | Trả: {receipt.returnedUnits}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Tỷ lệ: {receipt.receivedPercentage}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleViewReceipt(receipt)} title="Xem chi tiết">
                      <ViewIcon />
                    </IconButton>
                    {receipt.status === 'draft' && (
                      <IconButton size="small" color="primary" onClick={() => handleSendForApproval(receipt.id)} title="Gửi duyệt">
                        <SendIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* View Receipt Dialog */}
        <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Chi Tiết Phiếu Nhập - {selectedReceipt?.id}</DialogTitle>
          <DialogContent>{selectedReceipt && <ReceiptStatistics receipt={selectedReceipt} />}</DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ReceiptList;
