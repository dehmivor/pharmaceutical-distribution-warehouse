'use client';

import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

// Đơn giản hóa bảng chuyển đổi đơn vị (nếu cần)
const UNIT_CONVERSIONS = {
  kg: { g: 1000, tấn: 0.001 },
  g: { kg: 0.001, tấn: 0.000001 },
  tấn: { kg: 1000, g: 1000000 },
  thùng: { hộp: 12, cái: 144 },
  hộp: { thùng: 1 / 12, cái: 12 },
  cái: { hộp: 1 / 12, thùng: 1 / 144 },
  lít: { ml: 1000, gallon: 0.264172 },
  ml: { lít: 0.001, gallon: 0.000264172 },
  gallon: { lít: 3.78541, ml: 3785.41 },
  viên: { gói: 10, hộp: 100 }
};

function ReceiptStatistics({ inspections = [], setInspections }) {
  const convertUnit = (quantity, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return quantity;
    const conversions = UNIT_CONVERSIONS[fromUnit];
    if (conversions && conversions[toUnit]) {
      return quantity * conversions[toUnit];
    }
    return quantity;
  };

  const calculatePercentage = (received, expected) => {
    return expected > 0 ? Math.round((received / expected) * 100) : 0;
  };

  const handleDeleteInspection = async (id) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth-token');
      const currentUserId = token.userId;

      // Gọi API lấy inspection theo id
      const response = await axios.get(`${backendUrl}/api/inspections/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status !== 200) {
        enqueueSnackbar('Không tìm thấy phiếu kiểm nhập', { variant: 'error' });
        return;
      }

      const inspection = response.data;
      if (!inspection.created_by) {
        enqueueSnackbar('Phiếu kiểm nhập không có thông tin người tạo', { variant: 'error' });
        return;
      }

      if (inspection.created_by !== currentUserId) {
        enqueueSnackbar('Bạn không thể xóa phiếu kiểm nhập ko do bạn tạo', { variant: 'warning' });
        return;
      }

      // Nếu đúng user tạo, thực hiện xóa
      const deleteResponse = await axios.delete(`${backendUrl}/api/inspections/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (deleteResponse.status === 200 || deleteResponse.data.success) {
        enqueueSnackbar('Xóa phiếu kiểm nhập thành công', { variant: 'success' });
        setInspections((prev) => prev.filter((inspection) => inspection._id !== id));
      } else {
        enqueueSnackbar('Xóa phiếu kiểm nhập thất bại', { variant: 'error' });
      }
    } catch (error) {
      console.error('Error deleting inspection:', error);
      enqueueSnackbar('Xóa phiếu kiểm nhập thất bại', { variant: 'error' });
    }
  };

  // Xử lý từng inspection để lấy thông tin mặt hàng, số lượng dự kiến, đơn giá...
  const processedItems = inspections.map((inspection) => {
    // Tìm detail tương ứng trong details của import_order_id
    const detail = inspection.import_order_id?.details.find((d) => d.medicine_id === inspection.medicine_id._id) || {};

    const expectedQty = parseFloat(detail.quantity) || 0;
    const unitPrice = parseFloat(detail.unit_price) || 0;

    // Lấy số lượng thực nhận và từ chối từ inspection
    const actualQty = parseFloat(inspection.actual_quantity) || 0;
    const rejectedQty = parseFloat(inspection.rejected_quantity) || 0;

    const expectedUnit = inspection.medicine_id.unit_of_measure || 'viên';

    const convertedActualQty = convertUnit(actualQty, expectedUnit, expectedUnit);
    const totalInspectedQty = convertedActualQty + convertUnit(rejectedQty, expectedUnit, expectedUnit);

    let status = 'pending';
    if (totalInspectedQty === 0) status = 'pending';
    else if (totalInspectedQty >= expectedQty) status = 'received';
    else if (actualQty > 0 && totalInspectedQty < expectedQty) status = 'partial';
    else if (actualQty === 0 && rejectedQty > 0) status = 'shortage';

    const returnedQty = Math.max(0, expectedQty - totalInspectedQty);
    const receivedPercentage = calculatePercentage(convertedActualQty, expectedQty);
    const totalAmount = actualQty * unitPrice;

    return {
      id: inspection._id,
      productCode: inspection.medicine_id._id,
      productName: inspection.medicine_id.medicine_name,
      expectedUnit,
      actualUnit: expectedUnit,
      expectedQty,
      actualQty,
      rejectedQty,
      convertedActualQty,
      returnedQty,
      receivedPercentage,
      unitPrice,
      totalAmount,
      status
    };
  });

  const recalculatedStats = {
    totalExpected: processedItems.reduce((sum, item) => sum + item.expectedQty, 0),
    totalReceived: processedItems.reduce((sum, item) => sum + item.actualQty, 0),
    totalRejected: processedItems.reduce((sum, item) => sum + item.rejectedQty, 0),
    totalShortage: processedItems.reduce((sum, item) => sum + item.returnedQty, 0),
    totalValue: processedItems.reduce((sum, item) => sum + item.totalAmount, 0)
  };

  const overallReceivedPercentage = calculatePercentage(recalculatedStats.totalReceived, recalculatedStats.totalExpected);

  const getOverallStatus = () => {
    if (processedItems.length === 0) return { status: 'default', text: 'Chưa có dữ liệu' };
    const allReceived = processedItems.every((item) => item.status === 'received');
    const anyPartial = processedItems.some((item) => item.status === 'partial');
    const anyShortage = processedItems.some((item) => item.status === 'shortage');

    if (allReceived) return { status: 'success', text: 'Hoàn thành' };
    if (anyPartial && !anyShortage) return { status: 'warning', text: 'Nhận một phần' };
    if (anyShortage) return { status: 'error', text: 'Có thiếu hụt' };
    if (overallReceivedPercentage > 0) return { status: 'info', text: 'Đang thực hiện' };
    return { status: 'default', text: 'Chưa bắt đầu' };
  };

  const overallStatus = getOverallStatus();

  if (inspections.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">Chưa có phiếu kiểm nhập nào được tạo cho đơn hàng này.</Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Thống kê tổng quan */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
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

        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main">
                {recalculatedStats.totalRejected.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tổng từ chối
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {overallReceivedPercentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tỷ lệ hoàn thành
              </Typography>
              <Chip label={overallStatus.text} color={overallStatus.status} size="small" sx={{ mt: 1 }} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Biểu đồ tiến độ */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tiến Độ Kiểm Nhập
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Đã kiểm: {recalculatedStats.totalReceived.toLocaleString()}/{recalculatedStats.totalExpected.toLocaleString()} đơn vị
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {overallReceivedPercentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallReceivedPercentage}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  backgroundColor:
                    overallReceivedPercentage >= 100 ? 'success.main' : overallReceivedPercentage >= 80 ? 'warning.main' : 'primary.main'
                }
              }}
            />
          </Box>

          {recalculatedStats.totalShortage > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
              <Typography variant="body2" color="error.main" fontWeight="medium">
                ⚠️ Tổng thiếu hụt: {recalculatedStats.totalShortage.toLocaleString()} đơn vị (
                {Math.round((recalculatedStats.totalShortage / recalculatedStats.totalExpected) * 100)}%)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tổng số lượng còn thiếu so với dự kiến.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết từng mặt hàng đã kiểm */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Chi Tiết Các Mặt Hàng Đã Kiểm ({processedItems.length} sản phẩm)
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
                  <TableCell>Từ chối</TableCell>
                  <TableCell>Tỷ lệ nhận</TableCell>
                  <TableCell>Đơn giá</TableCell>
                  <TableCell>Thành tiền</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        Chưa có sản phẩm nào được kiểm tra.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  processedItems.map((item) => {
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
                          return 'Đã đủ';
                        case 'partial':
                          return 'Một phần';
                        case 'shortage':
                          return 'Thiếu';
                        default:
                          return 'Chờ kiểm';
                      }
                    };

                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.productCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.productName}</Typography>
                        </TableCell>
                        <TableCell>{item.expectedUnit}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.expectedQty.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="primary.main" fontWeight="medium">
                            {item.actualQty.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="error.main" fontWeight="medium">
                            {item.rejectedQty.toLocaleString()}
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
                        <TableCell>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              handleDeleteInspection(item.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ReceiptStatistics;
