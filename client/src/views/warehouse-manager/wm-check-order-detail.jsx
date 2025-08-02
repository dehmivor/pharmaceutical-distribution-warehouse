'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Box, CircularProgress, Alert, Typography, Paper, Grid, Chip, Button, Stack, LinearProgress, Divider } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Lấy header Authorization từ localStorage
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const formatDateTime = (d) => (d ? new Date(d).toLocaleString('vi-VN', { hour12: false }) : '');

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'checking':
      return 'primary';
    default:
      return 'default';
  }
};

// Màu pie chart mặc định cho các phần
const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CheckOrderDetailPage() {
  const id = useParams();
  const [orderData, setOrderData] = useState(null);
  const [logLocation, setLogLocation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Ví dụ giả lập dữ liệu kết quả kiểm kê (thực tế bạn bổ sung từ API)
  // Giả sử bạn có: total items, checked items, discrepancy items
  const inventoryResultData = orderData
    ? [
        { name: 'Đã kiểm kê', value: orderData.checkedItems || 70 },
        { name: 'Chưa kiểm kê', value: orderData.uncheckedItems || 20 },
        { name: 'Chênh lệch', value: orderData.discrepancies || 10 }
      ]
    : [];

  const totalCount = inventoryResultData.reduce((acc, cur) => acc + cur.value, 0) || 0;

  // Tính phần trăm cho progress bar
  const percentChecked = orderData?.checkedItems ? Math.round((orderData.checkedItems / totalCount) * 100) : 0;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${id?.checkOrderId}`, {
        headers: getAuthHeaders()
      });

      if (res.data.success) {
        setOrderData(res.data.data.checkorder);
        setLogLocation(res.data.data.loglocation || []);
      } else {
        setError(res.data.message || 'Lỗi khi tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi khi tải dữ liệu');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchData();
  }, [id]);

  // Nút reload thủ công
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing)
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleRefresh}>
          Thử lại
        </Button>
      </Box>
    );

  if (!orderData) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Chi tiết Phiếu Kiểm Kê
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Mã Phiếu: {orderData._id}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Đang làm mới...' : 'Làm mới'}
        </Button>
      </Stack>

      {/* Thông tin cơ bản */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Trạng thái:
            </Typography>
            <Chip variant="outlined" label={orderData.status} color={getStatusColor(orderData.status)} size="small" />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ngày kiểm kê:
            </Typography>
            <Typography variant="body1">{formatDate(orderData.inventory_check_date)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Warehouse Manager ID:
            </Typography>
            <Typography variant="body1">{orderData.warehouse_manager_id}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Người tạo (Created By):
            </Typography>
            {/* Nếu created_by có email: lấy phần trước @ nếu không thì hiển thị thẳng */}
            <Typography variant="body1">
              {(orderData.created_by.email && orderData.created_by.email.split('@')[0]) || orderData.created_by}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ghi chú:
            </Typography>
            <Typography variant="body1">{orderData.notes || 'Không có ghi chú'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ngày tạo:
            </Typography>
            <Typography variant="body1">{formatDateTime(orderData.createdAt)}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Ngày cập nhật:
            </Typography>
            <Typography variant="body1">{formatDateTime(orderData.updatedAt)}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Phần trăm đã kiểm kê */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={3}>
        <Typography variant="h6" gutterBottom>
          Trạng thái kiểm kê: {percentChecked}% đã kiểm kê
        </Typography>
        <LinearProgress variant="determinate" value={percentChecked} sx={{ height: 15, borderRadius: 2 }} />
      </Paper>

      {/* Biểu đồ kết quả kiểm kê */}
      <Paper sx={{ p: 3, mb: 4 }} elevation={3} style={{ height: 300 }}>
        <Typography variant="h6" gutterBottom>
          Tổng quan kết quả kiểm kê
        </Typography>
        {totalCount > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={inventoryResultData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {inventoryResultData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} mục`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 8 }}>
            Chưa có dữ liệu kết quả kiểm kê
          </Typography>
        )}
      </Paper>

      {/* Lịch sử thay đổi vị trí */}
      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="h6" gutterBottom>
          Lịch sử thay đổi vị trí
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {logLocation.length > 0 ? (
          logLocation.map((log, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2">
                {formatDateTime(log.createdAt)} - {log.old_location} → {log.new_location}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Không có lịch sử thay đổi vị trí.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
