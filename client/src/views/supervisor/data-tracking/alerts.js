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
import { enqueueSnackbar } from 'notistack';

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

  // Medicine below stock state
  const [medicinesBelowStock, setMedicinesBelowStock] = useState({
    criticalStock: [],
    warningStock: [],
    lowStock: [],
    summary: { critical: 0, warning: 0, low: 0, total: 0 }
  });

  // Bills due date state
  const [billsDueDate, setBillsDueDate] = useState({
    overdueBills: [],
    urgentBills: [],
    warningBills: [],
    upcomingBills: [],
    summary: { overdue: 0, urgent: 0, warning: 0, upcoming: 0, total: 0 }
  });

  // Track handled alerts by id
  const [handledAlertIds, setHandledAlertIds] = useState(new Set());

  // Ref to control fetch interval cleanup
  const intervalRef = useRef(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Ensure alerts is always an array
  const safeAlerts = Array.isArray(alerts) ? alerts.filter((alert) => alert && alert.id) : [];

  console.log('Current alerts state:', alerts);
  console.log('Safe alerts:', safeAlerts);
  console.log('Safe alerts length:', safeAlerts.length);
  console.log(
    'Safe alerts keys:',
    safeAlerts.map((alert) => alert.id)
  );

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

      // Fetch expired medicines data
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

      // Fetch medicines below stock data
      const stockRes = await axios.post(`${backendUrl}/api/cron/check-medicines-below-stock`);
      if (stockRes.data.success) {
        console.log('Medicines below stock API response:', stockRes.data);
        setMedicinesBelowStock({
          criticalStock: stockRes.data.data.medicinesByLevel?.criticalStock || [],
          warningStock: stockRes.data.data.medicinesByLevel?.warningStock || [],
          lowStock: stockRes.data.data.medicinesByLevel?.lowStock || [],
          summary: stockRes.data.data.summary || { critical: 0, warning: 0, low: 0, total: 0 }
        });
      } else {
        console.error('Failed to fetch medicines below stock data');
      }

      // Fetch bills due date data
      const billsRes = await axios.post(`${backendUrl}/api/cron/check-bills-due-date`);
      if (billsRes.data.success) {
        console.log('Bills due date API response:', billsRes.data);
        setBillsDueDate(billsRes.data.data);
      } else {
        console.error('Failed to fetch bills due date data');
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

  const handleCreateDestroyTicket = async (batch) => {
    try {
      const notificationData = {
        target_warehouse_managers: true, // Special flag to target all warehouse managers
        sender_id: null,
        title: 'Yêu cầu hủy thuốc',
        message: `Thuốc ${batch.medicine_id?.medicine_name || 'N/A'} (Batch: ${batch.batch_code}) cần được hủy do hết hạn`,
        type: 'system_alert',
        priority: 'high',
        status: 'unread',
        action_url: `/wm-export-orders?action=create_disposal&batchId=${batch._id}&batchCode=${batch.batch_code}&medicineName=${encodeURIComponent(batch.medicine_id?.medicine_name || 'N/A')}`,
        metadata: {
          batchId: batch._id,
          batchCode: batch.batch_code,
          medicineName: batch.medicine_id?.medicine_name || 'N/A',
          action: 'create_destroy_ticket'
        }
      };

      const response = await axios.post(`${backendUrl}/api/notifications`, notificationData);

      if (response && io) {
        console.log('Emitting newNotification to system room');
        io.to('system').emit('newNotification', response);
      } else {
        console.log('Cannot emit: io =', io);
      }

      if (response.data.success) {
        console.log('Thông báo đã được tạo thành công');
        // Show success message
        enqueueSnackbar(`Đã gửi thông báo hủy thuốc lô: ${batch.batch_code}`, { variant: 'success' });
      } else {
        console.error('Lỗi khi tạo thông báo:', response.data.error);
        enqueueSnackbar('Có lỗi khi tạo thông báo. Vui lòng thử lại.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      enqueueSnackbar('Có lỗi khi tạo thông báo. Vui lòng thử lại.', { variant: 'error' });
    }
  };

  const handleCreateImportOrder = async (medicine) => {
    try {
      console.log('Tạo thông báo nhập kho cho thuốc:', medicine.medicineName, medicine.medicineCode);

      // Create notification for all warehouse managers
      const notificationData = {
        target_warehouse_managers: true, // Special flag to target all warehouse managers
        sender_id: null,
        title: 'Yêu cầu nhập kho',
        message: `Thuốc ${medicine.medicineName || 'N/A'} (Code: ${medicine.medicineCode}) cần được nhập kho do thiếu hàng`,
        type: 'system_alert',
        priority: 'medium',
        status: 'unread',
        action_url: `/wm-import-orders?action=create_order&medicineId=${medicine.medicineId}&medicineCode=${medicine.medicineCode}&medicineName=${encodeURIComponent(medicine.medicineName || 'N/A')}`,
        metadata: {
          medicineId: medicine.medicineId,
          medicineCode: medicine.medicineCode,
          medicineName: medicine.medicineName || 'N/A',
          action: 'create_import_order'
        }
      };

      const response = await axios.post(`${backendUrl}/api/notifications`, notificationData);

      if (response.data.success) {
        console.log('Thông báo đã được tạo thành công');
        // Show success message
        enqueueSnackbar(`Đã gửi thông báo nhập kho cho warehouse managers: ${medicine.medicineName}`, { variant: 'success' });
      } else {
        console.error('Lỗi khi tạo thông báo:', response.data.error);
        enqueueSnackbar('Có lỗi khi tạo thông báo. Vui lòng thử lại.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Lỗi khi tạo thông báo:', error);
      enqueueSnackbar('Có lỗi khi tạo thông báo. Vui lòng thử lại.', { variant: 'error' });
    }
  };

  const handlePayBill = (bill) => {
    console.log('Thanh toán hóa đơn:', bill.bill_code, bill.total_amount);
    alert(`Pay bill: ${bill.bill_code} - Amount: ${bill.remainingAmount}`);
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
                    Gửi thông báo hủy
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

  // Render medicine below stock table with detailed information
  const renderMedicineStockTable = (medicineList, title, color = 'warning') => {
    if (!medicineList || medicineList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No medicines in this category
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ p: 2, color: color }}>
          {title} ({medicineList.length})
        </Typography>
        <Table size="small" aria-label={title}>
          <TableHead>
            <TableRow>
              <TableCell>Medicine Info</TableCell>
              <TableCell>Stock Status</TableCell>
              <TableCell>Storage Details</TableCell>
              <TableCell>Contracts</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {medicineList.map((medicine, index) => (
              <TableRow key={medicine.medicineId || `medicine-${index}`}>
                {/* Medicine Info */}
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {medicine.medicineName || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Code: {medicine.medicineCode || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {medicine.category || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Unit: {medicine.unit || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Stock Status */}
                <TableCell>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'error.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {medicine.totalQuantity}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Min Required: {medicine.minimumStock || 0}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      Shortage: {Math.max(0, (medicine.minimumStock || 0) - medicine.totalQuantity)}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Storage Details */}
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {medicine.batches?.length || 0} Batch(es)
                    </Typography>
                    {medicine.batches?.slice(0, 2).map((batch, idx) => (
                      <Box key={idx} sx={{ mt: 1, p: 1 }}>
                        <Typography variant="caption" display="block">
                          <strong>Batch:</strong> {batch.batchCode}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Qty:</strong> {batch.quantity} | <strong>Supplier:</strong> {batch.supplier}
                        </Typography>
                        <Typography variant="caption" display="block">
                          <strong>Expiry:</strong> {new Date(batch.expiryDate).toLocaleDateString()}
                        </Typography>
                        {batch.packages?.slice(0, 2).map((pkg, pkgIdx) => (
                          <Typography key={pkgIdx} variant="caption" display="block" color="text.secondary">
                            📦 {pkg.location} ({pkg.area}) - {pkg.quantity}
                          </Typography>
                        ))}
                      </Box>
                    ))}
                    {medicine.batches?.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{medicine.batches.length - 2} more batches...
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Contracts */}
                <TableCell>
                  <Box>
                    {medicine.contracts?.length > 0 ? (
                      medicine.contracts.slice(0, 2).map((contract, idx) => (
                        <Box key={idx} sx={{ mt: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1 }}>
                          <Typography variant="caption" display="block" fontWeight="bold">
                            {contract.contractCode}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Type: {contract.type}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Status: <span style={{ color: contract.status === 'active' ? 'green' : 'orange' }}>{contract.status}</span>
                          </Typography>
                          <Typography variant="caption" display="block">
                            {contract.supplier}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No active contracts
                      </Typography>
                    )}
                    {medicine.contracts?.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{medicine.contracts.length - 2} more contracts...
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Action */}
                <TableCell align="center">
                  <Button variant="contained" color="primary" size="small" onClick={() => handleCreateImportOrder(medicine)} sx={{ mr: 1 }}>
                    Gửi thông báo nhập kho
                  </Button>
                  <Button variant="outlined" color="secondary" size="small" onClick={() => window.open(`/sp-import-orders`, '_blank')}>
                    Go to Import
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Render bills due date table
  const renderBillsTable = (billsList, title, color = 'warning') => {
    if (!billsList || billsList.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No bills in this category
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ p: 2, color: color }}>
          {title} ({billsList.length})
        </Typography>
        <Table size="small" aria-label={title}>
          <TableHead>
            <TableRow>
              <TableCell>Bill Info</TableCell>
              <TableCell>Due Date Status</TableCell>
              <TableCell>Amount Details</TableCell>
              <TableCell>Supplier & Contract</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {billsList.map((bill, index) => (
              <TableRow key={bill._id || `bill-${index}`}>
                {/* Bill Info */}
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {bill.bill_code || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Type: {bill.bill_type || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {bill.status || 'N/A'}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Due Date Status */}
                <TableCell>
                  <Box>
                    {bill.priority === 'overdue' ? (
                      <Typography variant="h6" color="error.main" fontWeight="bold">
                        {bill.daysOverdue} days overdue
                      </Typography>
                    ) : (
                      <Typography variant="h6" color="warning.main" fontWeight="bold">
                        {bill.daysUntilDue} days left
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Due: {new Date(bill.due_date).toLocaleDateString()}
                    </Typography>
                    {bill.priority === 'overdue' && (
                      <Typography variant="body2" color="error.main">
                        ⚠️ Overdue!
                      </Typography>
                    )}
                  </Box>
                </TableCell>

                {/* Amount Details */}
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Total: {bill.total_amount?.toLocaleString() || 0} VND
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Paid: {bill.paid_amount?.toLocaleString() || 0} VND
                    </Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      Remaining: {bill.remainingAmount?.toLocaleString() || 0} VND
                    </Typography>
                  </Box>
                </TableCell>

                {/* Order & Contract Info */}
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {bill.import_order_id ? 'Import Order' : bill.export_order_id ? 'Export Order' : 'Payment Voucher'}
                    </Typography>
                    {bill.import_order_id && (
                      <Typography variant="body2" color="text.secondary">
                        Order: {bill.import_order_id.order_code || 'N/A'}
                      </Typography>
                    )}
                    {bill.export_order_id && (
                      <Typography variant="body2" color="text.secondary">
                        Order: {bill.export_order_id.order_code || 'N/A'}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(bill.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Action */}
                <TableCell>
                  <Button variant="outlined" color="secondary" size="small" onClick={() => window.open(`/sp-manage-bills`, '_blank')}>
                    Go to Bills
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Expired Medicine ALerts
        </Typography>
      </Box>
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
              Medicine Below Stock Alerts
            </Typography>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{medicinesBelowStock.summary.critical}</Typography>
                <Typography variant="body2">Critical (≥50% shortage)</Typography>
                <Typography variant="caption">Need immediate action</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{medicinesBelowStock.summary.warning}</Typography>
                <Typography variant="body2">Warning (20-50% shortage)</Typography>
                <Typography variant="caption">Need action soon</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{medicinesBelowStock.summary.low}</Typography>
                <Typography variant="body2">Low (0-20% shortage)</Typography>
                <Typography variant="caption">Monitor closely</Typography>
              </Paper>
            </Box>

            {/* Critical Stock Table */}
            {medicinesBelowStock.criticalStock.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {renderMedicineStockTable(medicinesBelowStock.criticalStock, 'Critical Stock - Need Immediate Action', 'error.main')}
              </Box>
            )}

            {/* Warning Stock Table */}
            {medicinesBelowStock.warningStock.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {renderMedicineStockTable(medicinesBelowStock.warningStock, 'Warning Stock - Need Action Soon', 'warning.main')}
              </Box>
            )}

            {/* Low Stock Table */}
            {medicinesBelowStock.lowStock.length > 0 && (
              <Box sx={{ mb: 3 }}>{renderMedicineStockTable(medicinesBelowStock.lowStock, 'Low Stock - Monitor Closely', 'info.main')}</Box>
            )}

            {/* No Stock Issues Message */}
            {medicinesBelowStock.summary.total === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6">All medicines have sufficient stock levels</Typography>
                <Typography variant="body2">No immediate action required</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Due Date Bill Alerts
            </Typography>

            {/* Summary Cards */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{billsDueDate.summary.overdue}</Typography>
                <Typography variant="body2">Overdue Bills</Typography>
                <Typography variant="caption">Need immediate payment</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{billsDueDate.summary.urgent}</Typography>
                <Typography variant="body2">Due in 7 days</Typography>
                <Typography variant="caption">Need urgent attention</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{billsDueDate.summary.warning}</Typography>
                <Typography variant="body2">Due in 30 days</Typography>
                <Typography variant="caption">Plan payment</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="h6">{billsDueDate.summary.upcoming}</Typography>
                <Typography variant="body2">Due in 90 days</Typography>
                <Typography variant="caption">Monitor</Typography>
              </Paper>
            </Box>

            {/* Overdue Bills Table */}
            {billsDueDate.overdueBills.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {renderBillsTable(billsDueDate.overdueBills, 'Overdue Bills - Immediate Action Required', 'error.main')}
              </Box>
            )}

            {/* Urgent Bills Table */}
            {billsDueDate.urgentBills.length > 0 && (
              <Box sx={{ mb: 3 }}>{renderBillsTable(billsDueDate.urgentBills, 'Urgent Bills - Due Within 7 Days', 'warning.main')}</Box>
            )}

            {/* Warning Bills Table */}
            {billsDueDate.warningBills.length > 0 && (
              <Box sx={{ mb: 3 }}>{renderBillsTable(billsDueDate.warningBills, 'Warning Bills - Due Within 30 Days', 'info.main')}</Box>
            )}

            {/* Upcoming Bills Table */}
            {billsDueDate.upcomingBills.length > 0 && (
              <Box sx={{ mb: 3 }}>
                {renderBillsTable(billsDueDate.upcomingBills, 'Upcoming Bills - Due Within 90 Days', 'success.main')}
              </Box>
            )}

            {/* No Bills Message */}
            {billsDueDate.summary.total === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6">No bills due for payment</Typography>
                <Typography variant="body2">All bills are up to date</Typography>
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Alerts;
