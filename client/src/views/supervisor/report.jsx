'use client';

import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

// Dữ liệu giả lập
const reportData = [
  {
    customerId: 'KH001',
    customerName: 'Khách hàng A',
    totalDebt: 2450000,
    overdueDebt: 890000,
    paidDebt: 1560000,
    dueSoonDebt: 340000
  },
  {
    customerId: 'KH002',
    customerName: 'Khách hàng B',
    totalDebt: 1580000,
    overdueDebt: 200000,
    paidDebt: 1100000,
    dueSoonDebt: 280000
  },
  {
    customerId: 'KH003',
    customerName: 'Khách hàng C',
    totalDebt: 3200000,
    overdueDebt: 450000,
    paidDebt: 2600000,
    dueSoonDebt: 150000
  },
  {
    customerId: 'KH004',
    customerName: 'Khách hàng D',
    totalDebt: 1750000,
    overdueDebt: 300000,
    paidDebt: 1300000,
    dueSoonDebt: 150000
  },
  {
    customerId: 'KH005',
    customerName: 'Khách hàng E',
    totalDebt: 820000,
    overdueDebt: 50000,
    paidDebt: 730000,
    dueSoonDebt: 40000
  }
];

const formatCurrency = (value) => value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export default function Report() {
  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Báo Cáo Thống Kê Công Nợ
      </Typography>

      <TableContainer component={Paper} sx={{ maxHeight: '70vh' }}>
        <Table stickyHeader aria-label="Báo cáo thống kê công nợ">
          <TableHead>
            <TableRow>
              <TableCell>Mã Khách Hàng</TableCell>
              <TableCell>Tên Khách Hàng</TableCell>
              <TableCell align="right">Tổng Công Nợ</TableCell>
              <TableCell align="right" sx={{ color: 'error.main' }}>
                Công Nợ Quá Hạn
              </TableCell>
              <TableCell align="right" sx={{ color: 'success.main' }}>
                Đã Thanh Toán
              </TableCell>
              <TableCell align="right" sx={{ color: 'warning.main' }}>
                Sắp Đến Hạn
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {reportData.map((row) => (
              <TableRow key={row.customerId} hover>
                <TableCell>{row.customerId}</TableCell>
                <TableCell>{row.customerName}</TableCell>
                <TableCell align="right">{formatCurrency(row.totalDebt)}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  {formatCurrency(row.overdueDebt)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>
                  {formatCurrency(row.paidDebt)}
                </TableCell>
                <TableCell align="right" sx={{ color: 'warning.main' }}>
                  {formatCurrency(row.dueSoonDebt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
