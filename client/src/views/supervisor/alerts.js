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
  Skeleton
} from '@mui/material';

const Alerts = () => {
  const [batches, setBatches] = useState({
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

  // Map type to MUI severity
  const severityMap = {
    'Low Inventory': 'warning',
    'Expired Batch': 'error',
    Recall: 'error',
    'New Entry': 'info',
    Info: 'info'
  };

  // Fetch batches and alerts from backend
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.post(`${backendUrl}/api/cron/check-expired-medicines`);
      if (res.data.success) {
        setBatches(res.data.data);

        // Giả lập thêm cảnh báo động từ API batch data, ví dụ tồn kho thấp, recall
        const dynamicAlerts = [];

        // Low Inventory example: batch with quantity <= 10 (mock)
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

        // Kết hợp mockAlerts + dynamicAlerts
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

    // Lặp lại fetch mỗi 5 phút
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

  // Đánh dấu cảnh báo đã xử lý
  const handleMarkAsRead = (alertId) => {
    setHandledAlertIds((prev) => new Set(prev).add(alertId));
  };

  const renderBatchTable = (batchList, label) => {
    if (!batchList || batchList.length === 0) return <Typography>Không có batch {label} tháng nào.</Typography>;

    return (
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          Batch hết hạn sau khoảng {label} tháng:
        </Typography>
        <Table size="small" aria-label={`${label} tháng`}>
          <TableHead>
            <TableRow>
              <TableCell>Batch Code</TableCell>
              <TableCell>Tên thuốc</TableCell>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell>Số lượng còn lại</TableCell>
              <TableCell>Nhà cung cấp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {batchList.map((batch) => (
              <TableRow key={batch._id}>
                <TableCell>{batch.batch_code}</TableCell>
                <TableCell>{batch.medicine_id?.medicine_name || 'Unknown'}</TableCell>
                <TableCell>{new Date(batch.expiry_date).toLocaleDateString()}</TableCell>
                <TableCell>{batch.quantity ?? 'N/A'}</TableCell>
                <TableCell>{batch.supplier || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          {/* Hiển thị batch hết hạn */}
          {renderBatchTable(batches.sixMonths, '6')}
          {renderBatchTable(batches.sevenMonths, '7')}
          {renderBatchTable(batches.eightMonths, '8')}

          {/* Hiển thị cảnh báo chi tiết */}
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
