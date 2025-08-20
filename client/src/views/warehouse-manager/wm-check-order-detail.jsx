'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import useTrans from '@/hooks/useTrans';

// Lấy header Authorization từ localStorage
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
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
    case 'checked':
      return 'success';
    case 'draft':
      return 'default';
    case 'valid':
      return 'success';
    case 'over_expected':
      return 'error';
    case 'under_expected':
      return 'error';
    default:
      return 'default';
  }
};

export default function CheckOrderDetail() {
  const theme = useTheme();
  const trans = useTrans();
  const { checkOrderId } = useParams();
  const [order, setOrder] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingInspections, setLoadingInspections] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const fetchOrder = async () => {
    setLoadingOrder(true);
    setError(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Updated URL to match the new consolidated route structure
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: getAuthHeaders()
      });
      if (res.data.success) {
        setOrder(res.data.data.checkorder);
      } else {
        throw new Error(res.data.message || trans.checkOrderDetail.failedToLoadOrder);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoadingOrder(false);
    }
  };

  const fetchInspections = async () => {
    if (!checkOrderId) return;
    setLoadingInspections(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const { data: inspectionsData } = await axios.get(`${backendUrl}/api/inventory-check-inspections/${checkOrderId}/inspections`, {
        headers: getAuthHeaders()
      });
      if (inspectionsData.success) {
        const inspectionsWithItems = await Promise.all(
          inspectionsData.data.map(async (inspection) => {
            try {
              const { data: itemsData } = await axios.get(`${backendUrl}/api/inventory-check-inspections/${inspection._id}/check-items`, {
                headers: getAuthHeaders()
              });
              return {
                ...inspection,
                check_items: itemsData.success ? itemsData.data : []
              };
            } catch (itemErr) {
              console.error(`Failed to load check items for inspection ${inspection._id}:`, itemErr);
              return { ...inspection, check_items: [] }; // Return inspection even if items fail
            }
          })
        );
        setInspections(inspectionsWithItems);
      } else {
        throw new Error(inspectionsData.error || trans.checkOrderDetail.failedToLoadInspections);
      }
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoadingInspections(false);
    }
  };

  useEffect(() => {
    if (!checkOrderId) return;
    fetchOrder();
    fetchInspections();
  }, [checkOrderId]);

  const handleRefresh = () => {
    fetchOrder();
    fetchInspections();
  };

  const handleCompleteCheck = async () => {
    if (!order) return;
    const uncheckedInspections = inspections.filter((inspection) => inspection.status !== 'checked');
    if (uncheckedInspections.length > 0) {
      setSnackbar({
        open: true,
        message: `Không thể hoàn thành đơn kiểm kê. Còn ${uncheckedInspections.length} vị trí chưa được kiểm kê.`,
        severity: 'error'
      });
      return;
    }
    // Client-side validation logic
    const overExpectedPackages = new Set();
    const underExpectedPackages = new Set();
    inspections.forEach((inspection) => {
      inspection.check_items.forEach((item) => {
        if (item.type === 'over_expected') {
          overExpectedPackages.add(item.package_id._id);
        } else if (item.type === 'under_expected') {
          underExpectedPackages.add(item.package_id._id);
        }
      });
    });
    let validationFailed = false;
    if (overExpectedPackages.size > 0) {
      for (const packageId of overExpectedPackages) {
        if (!underExpectedPackages.has(packageId)) {
          validationFailed = true;
          break;
        }
      }
    }
    if (validationFailed) {
      setSnackbar({
        open: true,
        message: trans.checkOrderDetail.validationError,
        severity: 'error'
      });
      return;
    }
    // Proceed with API call if validation passes
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Corrected URL to use the inventory/check-order route
      const response = await axios.patch(
        `${backendUrl}/api/inventory/check-order/${order._id}`,
        {
          status: 'completed'
        },
        {
          headers: getAuthHeaders()
        }
      );
      if (response.data.success) {
        setOrder((prev) => ({ ...prev, status: 'completed' }));
        setSnackbar({ open: true, message: trans.checkOrderDetail.completeCheckSuccess, severity: 'success' });
        fetchOrder(); // Refresh order data
        fetchInspections(); // Refresh inspections data
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.completeCheckError,
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.completeCheckErrorGeneral, severity: 'error' });
    }
  };

  const handleClearInspections = async () => {
    if (!order) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/inventory-check-inspections/${order._id}/clear-inspections`,
        {}, // Empty body as per your route definition
        {
          headers: getAuthHeaders()
        }
      );
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: trans.checkOrderDetail.clearInspectionsSuccess,
          severity: 'success'
        });
        fetchOrder(); // Refresh order data to get updated status
        fetchInspections(); // Refresh inspections data to get cleared quantities and draft status
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.clearInspectionsError,
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.clearInspectionsErrorGeneral, severity: 'error' });
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Corrected URL to use the inventory/check-order route
      const response = await axios.patch(
        `${backendUrl}/api/inventory/check-order/${order._id}`,
        {
          status: 'cancelled'
        },
        {
          headers: getAuthHeaders()
        }
      );
      if (response.data.success) {
        setOrder((prev) => ({ ...prev, status: 'cancelled' }));
        setSnackbar({ open: true, message: trans.checkOrderDetail.cancelOrderSuccess, severity: 'success' });
        fetchOrder(); // Refresh order data
        fetchInspections(); // Refresh inspections data
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.cancelOrderError,
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.cancelOrderErrorGeneral, severity: 'error' });
    }
  };

  // Function to handle deleting a check item (for over_expected)
  const handleDeleteItem = async (inspectionId, packageId) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.delete(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/check-items/${packageId}`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        // Reset inspection status to draft
        await axios.patch(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/status`, { status: 'draft' }, {
          headers: getAuthHeaders()
        });
        setSnackbar({ open: true, message: trans.checkOrderDetail.deleteItemSuccess, severity: 'success' });
        fetchInspections(); // Refresh inspections data
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.deleteItemError,
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.deleteItemErrorGeneral, severity: 'error' });
    }
  };

  // Function to clear actual quantity to 0 (for valid), keep type valid
  const handleClearActual = async (inspectionId, packageId, expectedQuantity) => {
    const newActual = 0;
    const newType = 'valid'; // Keep type as valid per correction
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/check-items`, {
        package_id: packageId,
        expected_quantity: expectedQuantity,
        actual_quantity: newActual,
        type: newType,
      }, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        // Reset inspection status to draft
        await axios.patch(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/status`, { status: 'draft' }, {
          headers: getAuthHeaders()
        });
        setSnackbar({ open: true, message: trans.checkOrderDetail.clearActualSuccess || 'Actual quantity cleared successfully', severity: 'success' });
        fetchInspections();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.clearActualError || 'Error clearing actual quantity',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.clearActualErrorGeneral || 'Error clearing actual quantity', severity: 'error' });
    }
  };

  // Function to reset status to valid (for under_expected)
  const handleResetToValid = async (inspectionId, packageId, expectedQuantity) => {
    const newActual = expectedQuantity;
    const newType = 'valid';
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/check-items`, {
        package_id: packageId,
        expected_quantity: expectedQuantity,
        actual_quantity: newActual,
        type: newType,
      }, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        // Reset inspection status to draft
        await axios.patch(`${backendUrl}/api/inventory-check-inspections/${inspectionId}/status`, { status: 'draft' }, {
          headers: getAuthHeaders()
        });
        setSnackbar({ open: true, message: trans.checkOrderDetail.resetToValidSuccess || 'Status reset to valid successfully', severity: 'success' });
        fetchInspections();
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || trans.checkOrderDetail.resetToValidError || 'Error resetting status to valid',
          severity: 'error'
        });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: trans.checkOrderDetail.resetToValidErrorGeneral || 'Error resetting status to valid', severity: 'error' });
    }
  };

  if (loadingOrder || loadingInspections) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleRefresh}>
          {trans.checkOrderDetail.retry}
        </Button>
      </Box>
    );
  }

  if (!order) return null;
  const isProcessing = order.status === 'processing';
  const isCancelledOrCompleted = order.status === 'cancelled' || order.status === 'completed';

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {trans.checkOrderDetail.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {trans.checkOrderDetail.orderId}: {order._id}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleRefresh}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} /> {trans.checkOrderDetail.refresh}
          </Button>
        </Stack>
        {/* Order Detail Section */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans.checkOrderDetail.orderDetail}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.checkOrderDetail.status}
                </Typography>
                <Chip variant="outlined" label={order.status} color={getStatusColor(order.status)} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.checkOrderDetail.inventoryDate}
                </Typography>
                <Typography variant="body1">{formatDate(order.inventory_check_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.checkOrderDetail.createdAt}
                </Typography>
                <Typography variant="body1">{formatDateTime(order.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.checkOrderDetail.warehouseManager}
                </Typography>
                <Typography variant="body1">{order.warehouse_manager_id?.email || order.warehouse_manager_id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.checkOrderDetail.createdBy}
                </Typography>
                <Typography variant="body1">{order.created_by?.email || order.created_by}</Typography>
              </Grid>
              {order.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.checkOrderDetail.notes}
                  </Typography>
                  <Typography variant="body1">{order.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
        {/* Inspections Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans.checkOrderDetail.inspections}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loadingInspections ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : inspections.length > 0 ? (
              <Stack spacing={2}>
                {inspections.map((ins) => {
                  const loc = ins.location_id;
                  const locStr = loc ? `${loc.area_id?.name || ''} - ${loc.bay || ''} - ${loc.row || ''} - ${loc.column || ''}` : 'N/A';
                  return (
                    <Accordion key={ins._id} sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {trans.checkOrderDetail.location}:
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {locStr}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {trans.checkOrderDetail.status}:
                            </Typography>
                            <Chip label={ins.status} color={getStatusColor(ins.status)} size="small" />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              {trans.checkOrderDetail.checkedBy}:
                            </Typography>
                            <Typography variant="body1">{ins.check_by?.email || ins.check_by || 'N/A'}</Typography>
                          </Grid>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          {trans.checkOrderDetail.packagesInLocation}:
                        </Typography>
                        {ins.check_items && ins.check_items.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{trans.checkOrderDetail.id}</TableCell>
                                <TableCell>{trans.checkOrderDetail.medicine}</TableCell>
                                <TableCell>{trans.checkOrderDetail.batch}</TableCell>
                                <TableCell>{trans.checkOrderDetail.expected}</TableCell>
                                <TableCell>{trans.checkOrderDetail.actual}</TableCell>
                                <TableCell>{trans.checkOrderDetail.status}</TableCell>
                                <TableCell>{trans.checkOrderDetail.action || 'Action'}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ins.check_items.map((item, index) => {
                                const pkgId = item.package_id?._id;
                                const uniqueKey = pkgId || `item-${ins._id}-${index}`;
                                const chipLabel =
                                  item.type === 'over_expected'
                                    ? trans.checkOrderDetail.overExpected
                                    : item.type === 'under_expected'
                                      ? trans.checkOrderDetail.underExpected
                                      : item.type.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); // Format other statuses
                                const chip = <Chip label={chipLabel} size="small" color={getStatusColor(item.type)} />;

                                let actionButton = null;
                                if (item.type === 'over_expected') {
                                  actionButton = (
                                    <IconButton
                                      aria-label="delete"
                                      size="small"
                                      onClick={() => handleDeleteItem(ins._id, pkgId)}
                                      disabled={isCancelledOrCompleted || !pkgId}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  );
                                } else if (item.type === 'valid') {
                                  actionButton = (
                                    <IconButton
                                      aria-label="clear"
                                      size="small"
                                      onClick={() => handleClearActual(ins._id, pkgId, item.expected_quantity)}
                                      disabled={isCancelledOrCompleted || !pkgId}
                                    >
                                      <ClearIcon fontSize="small" />
                                    </IconButton>
                                  );
                                } else if (item.type === 'under_expected') {
                                  actionButton = (
                                    <IconButton
                                      aria-label="reset"
                                      size="small"
                                      onClick={() => handleResetToValid(ins._id, pkgId, item.expected_quantity)}
                                      disabled={isCancelledOrCompleted || !pkgId}
                                    >
                                      <ClearIcon fontSize="small" />
                                    </IconButton>
                                  );
                                }

                                return (
                                  <TableRow key={uniqueKey}>
                                    <TableCell>{pkgId?.slice(-4) || 'N/A'}</TableCell>
                                    <TableCell>
                                      {`${item?.package_id?.batch_id?.medicine_id?.medicine_name || 'N/A'} - ${item?.package_id?.batch_id?.medicine_id?.license_code || 'N/A'}`}
                                    </TableCell>
                                    <TableCell>{item?.package_id?.batch_id?.batch_code || 'N/A'}</TableCell>
                                    <TableCell>{item?.expected_quantity || 0}</TableCell>
                                    <TableCell>{item?.actual_quantity || 0}</TableCell>
                                    <TableCell>{chip}</TableCell>
                                    <TableCell>{actionButton}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {trans.checkOrderDetail.noPackagesFound}
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                {trans.checkOrderDetail.noInspectionsToDisplay}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleClearInspections}
            disabled={!isProcessing} // Only enabled if order is processing
          >
            {trans.checkOrderDetail.clear}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={isCancelledOrCompleted} // Disabled if already cancelled or completed
          >
            {trans.checkOrderDetail.cancel}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteCheck}
            disabled={!isProcessing} // Only enabled if order is processing
          >
            {trans.checkOrderDetail.completeCheck}
          </Button>
        </Box>
        {/* Snackbar for messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}