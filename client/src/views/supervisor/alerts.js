'use client';

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert as MuiAlert,
  Button,
  Skeleton,
  TablePagination
} from '@mui/material';

const Alerts = () => {
  const [batches, setBatches] = useState({
    expiredUnder6Months: [],
    sixMonths: [],
    sevenMonths: [],
    eightMonths: []
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Track handled alerts by id
  const [handledAlertIds, setHandledAlertIds] = useState(new Set());

  // Ref to control fetch interval cleanup
  const intervalRef = useRef(null);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const severityMap = {
    'Low Inventory': 'warning',
    'Expired Batch': 'error',
    Recall: 'error',
    'New Entry': 'info',
    Info: 'info'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.post(`${backendUrl}/api/cron/check-expired-medicines`);
      if (res.data.success) {
        setBatches(res.data.data);

        const dynamicAlerts = [];

        res.data.data.sixMonths.forEach((batch) => {
          if (batch.quantity <= 10) {
            dynamicAlerts.push({
              id: `lowinv-${batch._id}`,
              type: 'Low Inventory',
              message: `Thuốc ${batch.medicine_id?.medicine_name || 'Unknown'} chỉ còn lại ${batch.quantity} chai lọ.`,
              date: new Date().toISOString(),
              handled: false
            });
          }
        });

        const mockAlerts = [
          {
            id: '1',
            type: 'Low Inventory',
            message: 'Thuốc Paracetamol sắp hết tồn kho',
            date: '2025-07-20T10:00:00Z',
            handled: false
          },
          {
            id: '2',
            type: 'Expired Batch',
            message: 'Batch XY123 của thuốc Aspirin hết hạn trong 7 ngày',
            date: '2025-07-22T08:30:00Z',
            handled: false
          }
        ];

        setAlerts([...mockAlerts, ...dynamicAlerts]);
      } else {
        setError('Không lấy được dữ liệu batch hết hạn');
      }
    } catch (err) {
      setError('Lỗi khi gọi API: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!ignore) await fetchData();
    };

    loadData();

    intervalRef.current = setInterval(
      () => {
        if (!ignore) loadData();
      },
      5 * 60 * 1000
    );

    return () => {
      ignore = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMarkAsRead = (alertId) => {
    setHandledAlertIds((prev) => new Set(prev).add(alertId));
  };

  const handleCreateDestroyTicket = (batch) => {
    console.log('Tạo phiếu hủy cho batch:', batch._id, batch.batch_code);
    alert(`Tạo phiếu hủy cho batch: ${batch.batch_code}`);
  };

  // Pagination state and handlers for each batch table
  // Expired under 6 months
  const [pageExpiredUnder6, setPageExpiredUnder6] = useState(0); // MUI TablePagination page is 0-based
  const [rowsPerPageExpiredUnder6, setRowsPerPageExpiredUnder6] = useState(5);

  // Six months
  const [pageSixMonths, setPageSixMonths] = useState(0);
  const [rowsPerPageSixMonths, setRowsPerPageSixMonths] = useState(5);

  // Seven months
  const [pageSevenMonths, setPageSevenMonths] = useState(0);
  const [rowsPerPageSevenMonths, setRowsPerPageSevenMonths] = useState(5);

  // Eight months
  const [pageEightMonths, setPageEightMonths] = useState(0);
  const [rowsPerPageEightMonths, setRowsPerPageEightMonths] = useState(5);

  const renderBatchTable = (batchList, label, page, setPage, rowsPerPage, setRowsPerPage) => {
    if (!batchList || batchList.length === 0) return <Typography>Không có batch {label} tháng nào.</Typography>;

    const count = batchList.length;

    const displayBatches = batchList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleChangePage = (event, newPage) => {
      setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    return (
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Batch hết hạn {label === '<6' ? 'dưới 6' : `sau khoảng ${label}`} tháng:
        </Typography>
        <Table size="small" aria-label={`${label} tháng`}>
          <TableHead>
            <TableRow>
              <TableCell>Batch Code</TableCell>
              <TableCell>Tên thuốc</TableCell>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell>Số lượng còn lại</TableCell>
              <TableCell>Nhà cung cấp</TableCell>
              <TableCell align="center">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayBatches.map((batch) => (
              <TableRow key={batch._id}>
                <TableCell>{batch.batch_code}</TableCell>
                <TableCell>{batch.medicine_id?.medicine_name || 'Unknown'}</TableCell>
                <TableCell>{new Date(batch.expiry_date).toLocaleDateString()}</TableCell>
                <TableCell>{batch.quantity ?? 'N/A'}</TableCell>
                <TableCell>{batch.supplier || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Button variant="contained" color="error" size="small" onClick={() => handleCreateDestroyTicket(batch)}>
                    Tạo phiếu hủy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{ mt: 1 }}
        />
      </TableContainer>
    );
  };

  const renderAlertItem = (alert) => {
    const isHandled = handledAlertIds.has(alert.id);
    return (
      <MuiAlert
        key={alert.id}
        severity={severityMap[alert.type] || 'info'}
        action={
          !isHandled && (
            <Button color="inherit" size="small" onClick={() => handleMarkAsRead(alert.id)}>
              Đã xử lý
            </Button>
          )
        }
        sx={{ mb: 1, opacity: isHandled ? 0.6 : 1 }}
      >
        {alert.message}
      </MuiAlert>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Alerts Hệ thống Quản lý Kho Thuốc
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Hiển thị các batch thuốc hết hạn và cảnh báo liên quan.
      </Typography>

      {loading && (
        <>
          {[...Array(3)].map((_, i) => (
            <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} key={i} />
          ))}
        </>
      )}

      {error && (
        <MuiAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </MuiAlert>
      )}

      {!loading && !error && (
        <>
          {renderBatchTable(
            batches.expiredUnder6Months,
            '<6',
            pageExpiredUnder6,
            setPageExpiredUnder6,
            rowsPerPageExpiredUnder6,
            setRowsPerPageExpiredUnder6
          )}

          {renderBatchTable(batches.sixMonths, '6', pageSixMonths, setPageSixMonths, rowsPerPageSixMonths, setRowsPerPageSixMonths)}

          {renderBatchTable(
            batches.sevenMonths,
            '7',
            pageSevenMonths,
            setPageSevenMonths,
            rowsPerPageSevenMonths,
            setRowsPerPageSevenMonths
          )}

          {renderBatchTable(
            batches.eightMonths,
            '8',
            pageEightMonths,
            setPageEightMonths,
            rowsPerPageEightMonths,
            setRowsPerPageEightMonths
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Các cảnh báo khác
            </Typography>
            {alerts.length === 0 && <Typography>Không có cảnh báo.</Typography>}
            {alerts.map(renderAlertItem)}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Alerts;
