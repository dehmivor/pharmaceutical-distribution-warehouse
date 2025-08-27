// components/CheckOrderDetail.js
'use client';

import React, { useState, useEffect } from 'react';
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
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import useTrans from '@/hooks/useTrans';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
const userId = userData.userId;

export default function CheckOrderDetail() {
  const theme = useTheme();
  const trans = useTrans();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  // Modal state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState('verify'); // 'verify' or 'packages'
  const [locationInput, setLocationInput] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [packages, setPackages] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [package_id, setPackage_id] = useState('');
  const [unexpected, setUnexpected] = useState([]);
  const [scannedIds, setScannedIds] = useState([]);

  const [checkItemsLoading, setCheckItemsLoading] = useState(false);

  const fetchOrder = async () => {
    setLoadingOrder(true);
    setError(null);
    try {
      const { data } = await axios.get(`/api/inventory-check-orders/${orderId}`, { headers: getAuthHeaders() });
      if (data.success) {
        setOrder(data.data);
      } else {
        throw new Error(data.error || trans.failedToLoadOrder);
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
    if (!orderId) return;
    setLoadingInspections(true);
    try {
      const { data } = await axios.get(`/api/inventory-check-inspections/${orderId}/inspections`, {
        headers: getAuthHeaders()
      });
      if (data.success) setInspections(data.data);
      else throw new Error(data.error || trans.failedToLoadInspections);
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoadingInspections(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchInspections();
  }, [orderId]);

  const handleRefresh = () => {
    fetchInspections();
  };

  const handleProceed = (ins) => {
    setSelectedInspection(ins);
    setLocationInput('');
    setVerifyError('');
    setStep('verify');
    setPackages([]);
    setDialogOpen(true);
  };

  const handleDialogClose = async () => {
    setDialogOpen(false);
    setSelectedInspection(null);
    if (step === 'packages') {
      await changelocationStatus('draft');
    }
    setUnexpected([]);
    fetchInspections();
    setPackage_id('');
  };

  const finalize = async () => {
    setDialogOpen(false);
    setSelectedInspection(null);
    await changelocationStatus('checked');
    setUnexpected([]);
    fetchInspections();
    setPackage_id('');
  };

  const changelocationStatus = async (locationStatus) => {
    await axios
      .patch(`/api/inventory-check-inspections/${selectedInspection._id}/status`, { status: locationStatus }, { headers: getAuthHeaders() })
      .then(() => { })
      .catch(() => setSnackbar({ open: true, message: trans.failedToUpdateStatus, severity: 'error' }));
  };

  const addSelfToChangeBy = async (val) => {
    await axios
      .patch(`/api/inventory-check-inspections/${val}/checker`, { checkBy: userId }, { headers: getAuthHeaders() })
      .then(() => { })
      .catch(() => setSnackbar({ open: true, message: trans.failedToAssignSelf, severity: 'error' }));
  };

  // Verify location input
  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationInput(val);
    if (val.length === 24) {
      if (val !== selectedInspection.location_id._id) {
        setVerifyError(trans.locationDoesNotMatch);
      } else {
        setVerifyError('');
        //add check_by
        addSelfToChangeBy(selectedInspection._id);
        //change status
        changelocationStatus('checking');
        // fetch packages
        fetchCheckItems(selectedInspection._id);
        setStep('packages');
      }
    } else setVerifyError('');
  };

  // Fetch the inspection's own check_list items
  const fetchCheckItems = async (inspectionId) => {
    try {
      setCheckItemsLoading(true)
      const { data } = await axios.get(`/api/inventory-check-inspections/${inspectionId}/check-items`, { headers: getAuthHeaders() });
      if (!data.success) throw new Error(data.error || trans.failedToLoadCheckItems);

      setPackages(data.data);

      // initialize editable quantities = expected_quantity
      const init = {};
      data.data.forEach((item) => {
        init[item.package_id._id] = item.expected_quantity;
      });
      setQuantities(init);
      setCheckItemsLoading(false)
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  // Handle quantity inputs
  const handleQtyChange = (pkgId, val) => {
    setQuantities((q) => ({ ...q, [pkgId]: Number(val) }));
  };

  // Confirm proceed: change status
  const handleConfirm = async () => {
    if (!selectedInspection) return;

    const inspectionId = selectedInspection._id;
    const url = `/api/inventory-check-inspections/${inspectionId}/check-items`;
    const headers = getAuthHeaders();

    // Build all PATCH promises…
    const updates = [];

    // 1) Expected packages (whether "valid" or "under_expected")
    packages.forEach((item) => {
      const pkgId = item.package_id._id;
      updates.push(
        axios.patch(
          url,
          {
            package_id: pkgId,
            expected_quantity: item.expected_quantity,
            actual_quantity: quantities[pkgId],
            type: item.type // either 'valid' or 'under_expected'
          },
          { headers }
        )
      );
    });

    // 2) Unexpected packages → always 'over_expected'
    unexpected.forEach((item) => {
      const pkgId = item._id;
      updates.push(
        axios.patch(
          url,
          {
            package_id: pkgId,
            expected_quantity: item.quantity,
            actual_quantity: quantities[pkgId] ?? item.quantity,
            type: 'over_expected'
          },
          { headers }
        )
      );
    });

    // Run them all in parallel
    try {
      await Promise.all(updates);
      setSnackbar({ open: true, message: trans.checkItemsUpdated, severity: 'success' });
      finalize();
    } catch (err) {
      console.error('Error updating check items:', err);
      setSnackbar({ open: true, message: trans.failedToSaveChanges, severity: 'error' });
    }
  };

  const handleScanPackages = async (val) => {
    setPackage_id(val);
    if (val.length !== 24) return;

    setScannedIds((ids) => (ids.includes(val) ? ids : [...ids, val]));
    setVerifyError('');

    // try expected list
    let idx = packages.findIndex((p) => p.package_id._id === val);
    if (idx > -1) {
      // it's expected: no API call
      return;
    }
    // try unexpected list
    idx = unexpected.findIndex((p) => p._id === val);
    if (idx > -1) {
      // it's expected: no API call
      return;
    }

    // otherwise fetch unexpected
    try {
      const { data } = await axios.get(`/api/packages/${val}`, { headers: getAuthHeaders() });
      if (!data.success) throw new Error(data.message || trans.notFound);

      setUnexpected((u) => [...u, data.data]);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleMissing = (item) => {
    const pkgId = item.package_id._id;

    // determine whether we're switching *to* under_expected (true) or back to valid (false)
    const currently = packages.find((p) => p.package_id._id === pkgId);
    const willUnder = currently?.type !== 'under_expected';

    // update packages' type
    setPackages((pkgs) =>
      pkgs.map((p) =>
        p.package_id._id === pkgId ? { ...p, type: willUnder ? 'under_expected' : 'valid' } : p
      )
    );

    // update the actual quantity shown in the input field:
    // - set to 0 when marking missing (under_expected)
    // - restore to expected_quantity when toggling back to valid
    setQuantities((q) => ({
      ...q,
      [pkgId]: willUnder ? 0 : item.package_id?.expected_quantity ?? item.expected_quantity ?? 0
    }));
  };

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container>
        <Typography variant="h4" gutterBottom>
          {trans.checkInventoryOrderDetail}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {trans.updateQuantityEachLocation}
        </Typography>

        {/* Order Detail Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans.checkInventoryOrderDetail}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loadingOrder ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : order ? (
              <Grid container spacing={2} mb={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.status}
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.inventoryDate}
                  </Typography>
                  <Typography variant="body1">{new Date(order.inventory_check_date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.createdAt}
                  </Typography>
                  <Typography variant="body1">{new Date(order.createdAt).toLocaleString()}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.warehouseManager}
                  </Typography>
                  <Typography variant="body1">{order.warehouse_manager_id.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.createdBy}
                  </Typography>
                  <Typography variant="body1">{order.created_by.email}</Typography>
                </Grid>

                {order.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {trans.notes}
                    </Typography>
                    <Typography variant="body1">{order.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography>{trans.noOrderDetailsToDisplay}</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Inspections Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans.inspections}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} mb={2}>
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>

            {loadingInspections ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{trans.location}</TableCell>
                    <TableCell>{trans.status}</TableCell>
                    <TableCell>{trans.action}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspections.map((ins) => {
                    const loc = ins.location_id;
                    const locStr = `${loc.area_id.name} - ${loc.bay} - ${loc.row} - ${loc.column}`;
                    return (
                      <TableRow key={ins._id}>
                        <TableCell>{locStr}</TableCell>
                        <TableCell>{ins.status}</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            size="small"
                            color={ins.status === 'checking' ? 'warning' : 'primary'}
                            disabled={ins.status === 'checked' || (ins.status === 'checking' && ins.check_by != userId) || order.status != 'processing'}
                            onClick={() => handleProceed(ins)}
                          >
                            {ins.status === 'checking' && ins.check_by != userId ? trans.continue : trans.proceed}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </AccordionDetails>
        </Accordion>
      </Container>

      {/* Proceed Dialog */}
      <Dialog open={dialogOpen} onClose={() => { }} disableEscapeKeyDown>
        <DialogTitle>
          {trans.inspection} {step === 'verify' ? trans.locationVerification : trans.packages}
        </DialogTitle>
        <DialogContent>
          {step === 'verify' ? (
            <TextField
              label={trans.scanLocationId}
              value={locationInput}
              onChange={handleLocationChange}
              fullWidth
              error={!!verifyError}
              helperText={verifyError}
              inputProps={{ maxLength: 24 }}
              style={{ marginTop: '8px' }}
            />
          ) : (
            <>
              {/* Scan input */}
              <TextField
                label={trans.scanPackageId}
                value={package_id}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setPackage_id(val);
                  if (val.length === 24) handleScanPackages(val);
                }}
                fullWidth
                error={!!verifyError}
                helperText={verifyError}
                inputProps={{ maxLength: 24 }}
                sx={{ mb: 2 }}
              />

              {/* Expected packages */}
              <Typography variant="subtitle2" gutterBottom>
                {trans.expectedPackages}
              </Typography>
              {checkItemsLoading ? (
                <CircularProgress />
              ) :
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{trans.id}</TableCell>
                      <TableCell>{trans.medicine}</TableCell>
                      <TableCell>{trans.batch}</TableCell>
                      <TableCell>{trans.expected}</TableCell>
                      <TableCell>{trans.actual}</TableCell>
                      <TableCell>{trans.action}</TableCell>
                      <TableCell>{trans.status}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {packages.map((item) => {
                      const pkgId = item.package_id._id;
                      const isScanned = scannedIds.includes(pkgId);
                      let chip;
                      if (!isScanned) {
                        chip = <Chip label={trans.unscanned} size="small" color="warning" />;
                      } else if (quantities[pkgId] === item.expected_quantity) {
                        chip = <Chip label={trans.normal} size="small" color="success" />;
                      } else {
                        chip = <Chip label={trans.abnormal} size="small" color="error" />;
                      }
                      return (
                        <TableRow key={pkgId} sx={isScanned ? { bgcolor: 'action.selected' } : {}}>
                          <TableCell>{pkgId?.slice(-4)}</TableCell>
                          <TableCell>
                            {`${item?.package_id?.batch_id?.medicine_id?.medicine_name} - ${item?.package_id?.batch_id?.medicine_id?.license_code}`}
                          </TableCell>
                          <TableCell>{item?.package_id?.batch_id?.batch_code}</TableCell>
                          <TableCell>{item?.expected_quantity}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={quantities[pkgId]}
                              onChange={(e) => handleQtyChange(pkgId, e.target.value)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item?.type === 'under_expected' ? (
                              <Button variant="outlined" size="small" onClick={() => handleMissing(item)}>
                                {trans.undo}
                              </Button>
                            ) : (
                              <Button variant="contained" size="small" color="error" onClick={() => handleMissing(item)}>
                                {trans.missing}
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>{chip}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              }


              {/* Unexpected packages */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                {trans.unexpectedPackages}
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{trans.id}</TableCell>
                    <TableCell>{trans.medicine}</TableCell>
                    <TableCell>{trans.batch}</TableCell>
                    <TableCell>{trans.expected}</TableCell>
                    <TableCell>{trans.actual}</TableCell>
                    <TableCell>{trans.delete}</TableCell>
                    <TableCell>{trans.status}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {unexpected.map((item) => {
                    const pkgId = item._id;
                    const isScanned = scannedIds.includes(pkgId);
                    const chip = isScanned ? (
                      <Chip label={trans.abnormal} size="small" color="error" />
                    ) : (
                      <Chip label={trans.unscanned} size="small" color="warning" />
                    );
                    return (
                      <TableRow key={pkgId} sx={isScanned ? { bgcolor: 'action.selected' } : {}}>
                        <TableCell>{pkgId.slice(-4)}</TableCell>
                        <TableCell>{`${item.batch_id.medicine_id.medicine_name} - ${item.batch_id.medicine_id.license_code}`}</TableCell>
                        <TableCell>{item.batch_id.batch_code}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        {/* Editable actual quantity */}
                        <TableCell>
                          <TextField
                            type="number"
                            value={quantities[pkgId] ?? item.quantity}
                            onChange={(e) => handleQtyChange(pkgId, e.target.value)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setUnexpected((u) => u.filter((x) => x._id !== pkgId))}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                        <TableCell>{chip}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {step === 'verify' ? (
            <Button onClick={handleDialogClose}>{trans.abort}</Button>
          ) : (
            <>
              <Button onClick={handleDialogClose}>{trans.abort}</Button>
              <Button variant="contained" onClick={handleConfirm}>
                {trans.confirm}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}
