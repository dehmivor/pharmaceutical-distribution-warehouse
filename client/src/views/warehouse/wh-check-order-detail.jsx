// components/CheckOrderDetail.js
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  Accordion, AccordionSummary, AccordionDetails, Box, Container, Grid, Stack, Typography,
  CircularProgress, Alert, Snackbar, IconButton, Table, TableHead, TableBody, TableRow,
  TableCell, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';

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
  const [package_id, setPackage_id] = useState('')



  const fetchOrder = async () => {
    setLoadingOrder(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `/api/inventory-check-orders/${orderId}`,
        { headers: getAuthHeaders() }
      );
      if (data.success) {
        setOrder(data.data);
      } else {
        throw new Error(data.error || 'Failed to load order');
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
      const { data } = await axios.get(`/api/inventory-check-inspections/${orderId}/inspections`, { headers: getAuthHeaders() });
      if (data.success) setInspections(data.data);
      else throw new Error(data.error || 'Failed to load inspections');
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoadingInspections(false);
    }
  };

  useEffect(() => { fetchOrder(); fetchInspections(); }, [orderId]);


  const handleRefresh = () => { fetchInspections(); };

  const handleProceed = (ins) => {
    setSelectedInspection(ins);
    setLocationInput(''); setVerifyError('');
    setStep('verify');
    setPackages([]);
    setDialogOpen(true);
  };

  const handleDialogClose = async () => {
    setDialogOpen(false);
    setSelectedInspection(null);
    if (step === 'packages') {
      await changelocationStatus('draft')
    }
    fetchInspections();
  };

  const changelocationStatus = async (locationStatus) => {
    await axios.patch(
      `/api/inventory-check-inspections/${selectedInspection._id}/status`,
      { status: locationStatus }, { headers: getAuthHeaders() }
    ).then(() => {
    }).catch(() => setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' }));
  };

  const addSelfToChangeBy = async (val) => {
    await axios.patch(
      `/api/inventory-check-inspections/${val}/checker`,
      { checkBy: userId }, { headers: getAuthHeaders() }
    ).then(() => {
    }).catch(() => setSnackbar({ open: true, message: 'Failed to assign self', severity: 'error' }));
  }


  // Verify location input
  const handleLocationChange = (e) => {
    const val = e.target.value;
    setLocationInput(val);
    if (val.length === 24) {
      if (val !== selectedInspection.location_id._id) {
        setVerifyError('Location does not match selected inspection.');
      } else {
        setVerifyError('');
        //add check_by
        addSelfToChangeBy(selectedInspection._id)
        //change status 
        changelocationStatus('checking')
        // fetch packages
        fetchPackages(val)
        setStep('packages');
        // default quantities
        const qtys = {};
        packages.forEach(pkg => qtys[pkg._id] = pkg.quantity);
        setQuantities(qtys);
      }
    } else setVerifyError('');
  };

  const fetchPackages = async (location_id) => {
    await axios.get(`/api/packages/location/${location_id}`, { headers: getAuthHeaders() })
      .then(res => res.data.success && setPackages(res.data.data.packages))
      .catch(() => setSnackbar({ open: true, message: 'Failed to load packages', severity: 'error' }));
  }

  // Handle quantity inputs
  const handleQtyChange = (pkgId, val) => {
    setQuantities(q => ({ ...q, [pkgId]: Number(val) }));
  };

  // Confirm proceed: change status
  const handleConfirm = () => {
    handleDialogClose();
  };

  const handleScanPackages = () => {

  }



  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container>
        <Typography variant="h4" gutterBottom>Check Inventory Order Detail</Typography>

        {/* Order Detail Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Order Detail</Typography>
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
                    Status
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Inventory Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.inventory_check_date).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(order.createdAt).toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Warehouse Manager
                  </Typography>
                  <Typography variant="body1">
                    {order.warehouse_manager_id.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1">
                    {order.created_by.email}
                  </Typography>
                </Grid>

                {order.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography variant="body1">
                      {order.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Typography>No order details to display.</Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Inspections Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Inspections</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} mb={2}>
              <IconButton size="small" onClick={handleRefresh}><RefreshIcon fontSize="small" /></IconButton>
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
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspections.map(ins => {
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
                            disabled={ins.status === 'checked' || (ins.status === 'checking' && ins.check_by != userId)}
                            onClick={() => handleProceed(ins)}
                          >{ins.check_by === userId ? 'Continue' : 'Proceed'}</Button>
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
        <DialogTitle>Inspection {step === 'verify' ? 'Location Verification' : 'Packages'}</DialogTitle>
        <DialogContent>
          {step === 'verify' ? (
            <TextField
              label="Scan Location ID"
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
              <TextField
                label="Scan Package ID"
                value={package_id}
                onChange={handleScanPackages}
                fullWidth
                error={!!verifyError}
                helperText={verifyError}
                inputProps={{ maxLength: 24 }}
                style={{ marginTop: '8px' }}
              />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Medicine</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Expected Qty</TableCell>
                    <TableCell>Actual Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map(pkg => (
                    <TableRow key={pkg._id}>
                      <TableCell>{pkg._id.slice(-4)}</TableCell>
                      <TableCell>{`${pkg.batch_id.medicine_id.medicine_name} - ${pkg.batch_id.medicine_id.license_code}`}</TableCell>
                      <TableCell>{pkg.batch_id.batch_code}</TableCell>
                      <TableCell>{pkg.quantity}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={quantities[pkg._id] || pkg.quantity}
                          onChange={e => handleQtyChange(pkg._id, e.target.value)}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {step === 'verify' ? (
            <Button onClick={handleDialogClose}>Abort</Button>
          ) : (
            <>
              <Button onClick={handleDialogClose}>Cancel</Button>
              <Button variant="contained" onClick={handleConfirm}>Confirm</Button></>
          )}
        </DialogActions>
      </Dialog>



      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(sn => ({ ...sn, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(sn => ({ ...sn, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
