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
import useTrans from '@/hooks/useTrans';

const Alerts = () => {
  const trans = useTrans();
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

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Ensure alerts is always an array
  const safeAlerts = Array.isArray(alerts) ? alerts.filter((alert) => alert && alert.id) : [];

  console.log('Current alerts state:', alerts);
  console.log('Safe alerts:', safeAlerts);

  const severityMap = {
    [trans.alerts.lowInventory]: 'warning',
    [trans.alerts.expiredBatch]: 'error',
    [trans.alerts.recall]: 'error',
    [trans.alerts.newEntry]: 'info',
    [trans.alerts.info]: 'info'
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await axios.post(`${backendUrl}/api/cron/check-expired-medicines`);
      if (res.data.success) {
        console.log('Alerts API response:', res.data);
        setBatches(res.data.data);

        const dynamicAlerts = [];

        // Check for low inventory alerts (quantity <= 10)
        if (res.data.data.sixMonths && Array.isArray(res.data.data.sixMonths)) {
          res.data.data.sixMonths.forEach((batch) => {
            if (batch && batch.quantity && batch.quantity <= 10) {
              const alertId = `lowinv-${batch._id || batch.batch_code || Date.now()}`;
              console.log('Creating low inventory alert with ID:', alertId);
              dynamicAlerts.push({
                id: alertId,
                type: trans.alerts.lowInventory,
                message: trans.alerts.lowInventoryMessage
                  .replace('{name}', batch.medicine_id?.medicine_name || 'Unknown')
                  .replace('{quantity}', batch.quantity),
                date: new Date().toISOString(),
                handled: false
              });
            }
          });
        }

        // Check for expired batches
        if (res.data.data.expiredUnder6Months && Array.isArray(res.data.data.expiredUnder6Months)) {
          res.data.data.expiredUnder6Months.forEach((batch) => {
            if (batch && batch.quantity && batch.quantity > 0) {
              const alertId = `expired-${batch._id || batch.batch_code || Date.now()}`;
              console.log('Creating expired batch alert with ID:', alertId);
              dynamicAlerts.push({
                id: alertId,
                type: trans.alerts.expiredBatch,
                message: `Batch ${batch.batch_code} của thuốc ${batch.medicine_id?.medicine_name || 'Unknown'} hết hạn trong ${Math.ceil((new Date(batch.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} ngày`,
                date: new Date().toISOString(),
                handled: false
              });
            }
          });
        }

        // Ensure dynamicAlerts is always an array and has unique IDs
        const finalAlerts = Array.isArray(dynamicAlerts) ? dynamicAlerts.filter((alert) => alert && alert.id) : [];
        console.log('Dynamic alerts before filtering:', dynamicAlerts);
        console.log('Final alerts after filtering:', finalAlerts);
        setAlerts(finalAlerts);
        console.log('Dynamic alerts created:', finalAlerts);
        console.log('Final alerts array:', finalAlerts);
      } else {
        setError(trans.alerts.dataFetchError);
      }
    } catch (err) {
      console.error('Error fetching alerts data:', err);
      setError(trans.alerts.apiError.replace('{message}', err.message));
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
    alert(trans.alerts.createDestroyTicketMessage.replace('{code}', batch.batch_code));
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
    if (!batchList || batchList.length === 0) return <Typography>{trans.alerts.noBatches.replace('{months}', label)}</Typography>;

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
          Batch expired {label === '<6' ? trans.alerts.expiredUnder6 : trans.alerts.expiredAfter.replace('{months}', label)}{' '}
          {trans.alerts.months}:
        </Typography>
        <Table size="small" aria-label={`${label} tháng`}>
          <TableHead>
            <TableRow>
              <TableCell>{trans.alerts.batchCode}</TableCell>
              <TableCell>{trans.alerts.medicineName}</TableCell>
              <TableCell>{trans.alerts.expiryDate}</TableCell>
              <TableCell>{trans.alerts.remainingQuantity}</TableCell>
              <TableCell>{trans.alerts.supplier}</TableCell>
              <TableCell align="center">{trans.alerts.action}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayBatches.map((batch, index) => (
              <TableRow key={batch._id || `batch-${index}`}>
                <TableCell>{batch.batch_code || 'N/A'}</TableCell>
                <TableCell>{batch.medicine_id?.medicine_name || trans.common.unknown}</TableCell>
                <TableCell>{batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{batch.quantity !== undefined ? batch.quantity : 'N/A'}</TableCell>
                <TableCell>{batch.supplier || 'N/A'}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => handleCreateDestroyTicket(batch)}
                    disabled={!batch.batch_code}
                  >
                    {trans.alerts.createDestroyTicket}
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
          labelRowsPerPage={trans.alerts.rowsPerPage}
          labelDisplayedRows={({ from, to, count }) =>
            trans.alerts.displayedRows.replace('{from}', from).replace('{to}', to).replace('{count}', count)
          }
          sx={{ mt: 1 }}
        />
      </TableContainer>
    );
  };

  const renderAlertItem = (alert) => {
    if (!alert || !alert.id) {
      console.warn('Alert without ID:', alert);
      return null;
    }

    const isHandled = handledAlertIds.has(alert.id);
    return (
      <MuiAlert
        key={alert.id}
        severity={severityMap[alert.type] || 'info'}
        action={
          !isHandled && (
            <Button color="inherit" size="small" onClick={() => handleMarkAsRead(alert.id)}>
              {trans.alerts.handled}
            </Button>
          )
        }
        sx={{ mb: 1, opacity: isHandled ? 0.6 : 1 }}
      >
        {alert.message || 'No message'}
      </MuiAlert>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {trans.alerts.systemTitle}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        {trans.alerts.description}
      </Typography>

      {loading && (
        <>
          {[...Array(3)].map((_, i) => (
            <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} key={`skeleton-${i}`} />
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
              {trans.alerts.otherAlerts}
            </Typography>
            {safeAlerts.length === 0 && <Typography>{trans.alerts.noAlerts}</Typography>}
            {safeAlerts.map((alert) => renderAlertItem(alert))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Alerts;
