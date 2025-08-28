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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      const deleteResponse = await axios.delete(`${backendUrl}/api/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (deleteResponse.status === 204) {
        enqueueSnackbar('Xóa phiếu kiểm nhập thành công', { variant: 'success' });

        // ✅ CẬP NHẬT STATE THAY VÌ RELOAD
        if (setInspections) {
          setInspections((prevInspections) => prevInspections.filter((inspection) => inspection._id !== id));
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Xóa phiếu kiểm nhập thất bại';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };
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
    else if (actualQty - rejectedQty == expectedQty) status = 'received';
    else if (actualQty - rejectedQty >= expectedQty && actualQty > 0 && totalInspectedQty < expectedQty) status = 'partial';
    else if (actualQty === 0 && rejectedQty > 0) status = 'shortage';

    const returnedQty = Math.max(0, expectedQty - totalInspectedQty);
    const receivedPercentage = calculatePercentage(convertedActualQty, expectedQty);
    const totalAmount = actualQty * unitPrice;

    return {
      id: inspection._id,
      productCode: inspection.medicine_id.license_code || 'N/A',
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
                  <TableCell>Mã thuốc</TableCell>
                  <TableCell>Tên thuốc</TableCell>
                  <TableCell>Đơn vị</TableCell>
                  <TableCell>Dự kiến</TableCell>
                  <TableCell>Thực nhận</TableCell>
                  <TableCell>Từ chối</TableCell>
                  <TableCell>Đơn giá</TableCell>
                  <TableCell>Thành tiền</TableCell>
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
                        case 'waiting':
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
                          <Typography variant="body2">{item.unitPrice.toLocaleString()} ₫</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {item.totalAmount.toLocaleString()} ₫
                          </Typography>
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
