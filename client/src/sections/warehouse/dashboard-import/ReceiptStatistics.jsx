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
  Paper,
  Chip,
  Alert
} from '@mui/material';

function ReceiptStatistics({ statistics, items = [] }) {
  // Fallback data nếu không có statistics
  const stats = statistics || {
    totalExpected: 0,
    totalReceived: 0,
    totalReturned: 0,
    receivedPercentage: 0,
    totalValue: 0
  };

  const calculatePercentage = (received, expected) => {
    return expected > 0 ? Math.round((received / expected) * 100) : 0;
  };

  const convertUnit = (quantity, fromUnit, toUnit) => {
    // Đơn giản hóa - trong thực tế cần logic chuyển đổi phức tạp hơn
    if (fromUnit === toUnit) return quantity;
    return quantity; // Tạm thời return như cũ
  };

  // Tính toán chi tiết cho từng mặt hàng
  const processedItems = items.map((item, index) => {
    const expectedQty = parseFloat(item.expectedQuantity) || 0;
    const actualQty = parseFloat(item.actualQuantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;

    // Chuyển đổi đơn vị nếu khác nhau
    const convertedActualQty = convertUnit(actualQty, item.actualUnit || item.expectedUnit, item.expectedUnit);

    // Tính số lượng trả lại (nếu dự kiến > thực nhận)
    const returnedQty = Math.max(0, expectedQty - convertedActualQty);

    // Tính tỷ lệ nhận hàng
    const receivedPercentage = calculatePercentage(convertedActualQty, expectedQty);

    // Tính thành tiền (dựa trên số lượng thực nhận)
    const totalAmount = actualQty * unitPrice;

    return {
      ...item,
      id: index + 1,
      expectedQty,
      actualQty,
      convertedActualQty,
      returnedQty,
      receivedPercentage,
      totalAmount,
      unitPrice
    };
  });

  // Tính lại totals từ processed items (để đảm bảo consistency)
  const recalculatedStats = {
    totalExpected: processedItems.reduce((sum, item) => sum + item.expectedQty, 0),
    totalReceived: processedItems.reduce((sum, item) => sum + item.convertedActualQty, 0),
    totalReturned: processedItems.reduce((sum, item) => sum + item.returnedQty, 0),
    totalValue: processedItems.reduce((sum, item) => sum + item.totalAmount, 0)
  };

  const overallPercentage = calculatePercentage(recalculatedStats.totalReceived, recalculatedStats.totalExpected);

  // Trạng thái tổng quan
  const getOverallStatus = () => {
    if (overallPercentage >= 100) return { status: 'success', text: 'Hoàn thành' };
    if (overallPercentage >= 80) return { status: 'warning', text: 'Gần hoàn thành' };
    if (overallPercentage > 0) return { status: 'info', text: 'Đang thực hiện' };
    return { status: 'default', text: 'Chưa bắt đầu' };
  };

  const overallStatus = getOverallStatus();

  if (items.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">Chưa có mặt hàng nào để hiển thị thống kê. Vui lòng thêm sản phẩm vào phiếu nhập.</Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Thống kê tổng quan */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {recalculatedStats.totalReceived.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng đã nhận
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {recalculatedStats.totalReturned.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng thiếu hụt
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
                Tỷ lệ hoàn thành
              </Typography>
              <Chip label={overallStatus.text} color={overallStatus.status} size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {recalculatedStats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng giá trị (₫)
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
                Đã nhận: {recalculatedStats.totalReceived.toLocaleString()}/{recalculatedStats.totalExpected.toLocaleString()} đơn vị
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {overallPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  backgroundColor: overallPercentage >= 100 ? 'success.main' : overallPercentage >= 80 ? 'warning.main' : 'primary.main'
                }
              }}
            />
          </Box>

          {recalculatedStats.totalReturned > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight="medium">
                ⚠️ Thiếu hụt: {recalculatedStats.totalReturned.toLocaleString()} đơn vị (
                {Math.round((recalculatedStats.totalReturned / recalculatedStats.totalExpected) * 100)}%)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cần liên hệ nhà cung cấp để bổ sung hàng hóa
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết từng mặt hàng */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chi Tiết Từng Mặt Hàng ({processedItems.length} sản phẩm)
          </Typography>

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Mã SP</TableCell>
                  <TableCell>Tên sản phẩm</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Dự kiến</TableCell>
                  <TableCell>Thực nhận</TableCell>
                  <TableCell>Thiếu hụt</TableCell>
                  <TableCell>Tỷ lệ</TableCell>
                  <TableCell>Đơn giá</TableCell>
                  <TableCell>Thành tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có sản phẩm nào
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  processedItems.map((item, index) => {
                    const getStatusColor = (status) => {
                      switch (status) {
                        case 'received':
                          return 'success';
                        case 'partial':
                          return 'warning';
                        case 'shortage':
                          return 'error';
                        default:
                          return 'default';
                      }
                    };

                    const getStatusText = (status) => {
                      switch (status) {
                        case 'received':
                          return 'Đã nhận đủ';
                        case 'partial':
                          return 'Nhận một phần';
                        case 'shortage':
                          return 'Thiếu hàng';
                        default:
                          return 'Chờ nhận';
                      }
                    };

                    return (
                      <TableRow key={item.id || index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.productCode || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.productName || 'Chưa nhập tên'}</Typography>
                          {item.lotNumber && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Lô: {item.lotNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{item.expectedUnit || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.expectedQty.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary.main" fontWeight="medium">
                            {item.convertedActualQty.toLocaleString()}
                          </Typography>
                          {item.actualUnit !== item.expectedUnit && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ({item.actualQty} {item.actualUnit})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={item.returnedQty > 0 ? 'error.main' : 'text.secondary'}
                            fontWeight={item.returnedQty > 0 ? 'medium' : 'normal'}
                          >
                            {item.returnedQty.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 120 }}>
                            <Typography variant="body2" sx={{ mr: 1, minWidth: 35 }}>
                              {item.receivedPercentage}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(item.receivedPercentage, 100)}
                              sx={{
                                flexGrow: 1,
                                height: 6,
                                borderRadius: 3,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    item.receivedPercentage >= 100
                                      ? 'success.main'
                                      : item.receivedPercentage >= 50
                                        ? 'warning.main'
                                        : 'error.main'
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.unitPrice.toLocaleString()} ₫</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.totalAmount.toLocaleString()} ₫
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={getStatusText(item.status)} color={getStatusColor(item.status)} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {processedItems.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Tổng số mặt hàng:</strong> {processedItems.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Đã hoàn thành:</strong> {processedItems.filter((item) => item.status === 'received').length}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Nhận một phần:</strong> {processedItems.filter((item) => item.status === 'partial').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Chưa nhận:</strong> {processedItems.filter((item) => item.status === 'pending').length}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default ReceiptStatistics;
