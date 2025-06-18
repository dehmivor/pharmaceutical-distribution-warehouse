'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

function ReceiptStatistics({ receipt }) {
  const sampleItems = [
    {
      name: 'Gạo ST25',
      expectedQuantity: 100,
      receivedQuantity: 100,
      returnedQuantity: 0,
      unit: 'bao',
      unitPrice: 850000
    },
    {
      name: 'Đường trắng',
      expectedQuantity: 500,
      receivedQuantity: 450,
      returnedQuantity: 50,
      unit: 'kg',
      unitPrice: 25000
    },
    {
      name: 'Nước mắm',
      expectedQuantity: 200,
      receivedQuantity: 200,
      returnedQuantity: 0,
      unit: 'chai',
      unitPrice: 45000
    }
  ];

  const calculatePercentage = (received, expected) => {
    return expected > 0 ? Math.round((received / expected) * 100) : 0;
  };

  const totalExpected = sampleItems.reduce((sum, item) => sum + item.expectedQuantity, 0);
  const totalReceived = sampleItems.reduce((sum, item) => sum + item.receivedQuantity, 0);
  const totalReturned = sampleItems.reduce((sum, item) => sum + item.returnedQuantity, 0);
  const overallPercentage = calculatePercentage(totalReceived, totalExpected);

  return (
    <Box>
      {/* Thống kê tổng quan */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalReceived}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng đơn vị nhận
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error">
                {totalReturned}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng đơn vị trả
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {overallPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ nhận hàng
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {totalExpected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng dự kiến
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biểu đồ tiến độ */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tiến Độ Nhận Hàng
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Đã nhận: {totalReceived}/{totalExpected} đơn vị
              </Typography>
              <Typography variant="body2">{overallPercentage}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={overallPercentage} sx={{ height: 10, borderRadius: 5 }} />
          </Box>

          {totalReturned > 0 && (
            <Box>
              <Typography variant="body2" color="error">
                Đã trả lại: {totalReturned} đơn vị ({Math.round((totalReturned / totalExpected) * 100)}%)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết từng mặt hàng */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chi Tiết Từng Mặt Hàng
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tên hàng</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Dự kiến</TableCell>
                  <TableCell>Đã nhận</TableCell>
                  <TableCell>Đã trả</TableCell>
                  <TableCell>Tỷ lệ</TableCell>
                  <TableCell>Thành tiền</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sampleItems.map((item, index) => {
                  const itemPercentage = calculatePercentage(item.receivedQuantity, item.expectedQuantity);
                  const itemTotal = item.receivedQuantity * item.unitPrice;

                  return (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.expectedQuantity}</TableCell>
                      <TableCell>{item.receivedQuantity}</TableCell>
                      <TableCell>{item.returnedQuantity}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {itemPercentage}%
                          </Typography>
                          <LinearProgress variant="determinate" value={itemPercentage} sx={{ flexGrow: 1, height: 6 }} />
                        </Box>
                      </TableCell>
                      <TableCell>{itemTotal.toLocaleString()} VNĐ</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ReceiptStatistics;
