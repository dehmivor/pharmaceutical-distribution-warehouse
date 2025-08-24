'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Container,
  Divider,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Snackbar,
  Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTheme } from '@mui/material/styles';
import useTrans from '@/hooks/useTrans';

export default function ExportOrderDetail() {
  const theme = useTheme();
  const trans = useTrans();
  const { orderId } = useParams();

  // Add missing API configuration
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
  });

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    return {
      'Content-Type': trans?.common?.contentType || 'application/json',
      ...(token && { Authorization: `${trans?.common?.bearer || 'Bearer'} ${token}` })
    };
  };

  const [order, setOrder] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingOut, setLoadingOut] = useState(false);
  const [error, setError] = useState(null);
  const [pickingDone, setPickingDone] = useState(false);
  const [isInternalOrder, setIsInternalOrder] = useState(false); // Add flag for internal orders

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [locInput, setLocInput] = useState('');
  const [locPackages, setLocPackages] = useState([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const [proceedOpen, setProceedOpen] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(null);
  const [neededQty, setNeededQty] = useState(0);
  const [verifyInput, setVerifyInput] = useState('');
  const [pickAmount, setPickAmount] = useState(0);
  const [currentDetailId, setCurrentDetailId] = useState(null);

  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userId = userData.userId;

  // Scan Package modal state
  const [openPkgModal, setOpenPkgModal] = useState(false);
  const [pkgInput, setPkgInput] = useState('');

  const [pkgDetail, setPkgDetail] = useState(null);
  const [loadingPkgDetail, setLoadingPkgDetail] = useState(false);
  const [onHandQty, setOnHandQty] = useState(0);
  const [recommendedQty, setRecommendedQty] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error'
  });

  // Handler to open the Proceed modal
  const openProceedModal = (detailId, pkg, needed) => {
    setCurrentDetailId(detailId);
    setCurrentPkg(pkg.package_id); // only store the ID
    setNeededQty(needed);
    setVerifyInput('');
    setProceedOpen(true);
    handleCloseModal();
  };

  const closeProceedModal = () => {
    setProceedOpen(false);
    setCurrentPkg(null);
    setVerifyInput('');
  };

  const handleProceedSubmit = async (e) => {
    e.preventDefault();

    if (!pkgDetail || verifyInput !== String(pkgDetail._id)) {
      console.warn(trans?.common?.cannotSubmitInvalidPackage || 'Cannot submit invalid package');
      setSnackbar({
        open: true,
        message: trans?.common?.cannotSubmitInvalidPackage || 'Cannot submit invalid package',
        severity: 'warning'
      });
      return;
    }

    try {
      const pkgId = pkgDetail._id;

      await axiosInstance.post(
        `/api/export-orders/${orderId}/details/${currentDetailId}/inspections`,
        {
          package_id: pkgId,
          quantity: pickAmount,
          user_id: userId
        },
        { headers: getAuthHeaders() }
      );

      // Show success message
      setSnackbar({
        open: true,
        message: trans?.common?.inspectionCreatedSuccessfully || 'Inspection created successfully',
        severity: 'success'
      });

      // Close modal & refresh outstanding list
      closeProceedModal();
      handleRefresh();
    } catch (err) {
      console.error('Error creating inspection:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || 'Error creating inspection',
        severity: 'error'
      });
    }
  };

  // reset modal state
  const resetModal = () => {
    setLocInput('');
    setLocPackages([]);
  };

  // open modal, resetting first
  const handleOpenModal = () => {
    resetModal();
    setOpenModal(true);
  };

  // close modal, resetting after
  const handleCloseModal = () => {
    setOpenModal(false);
    resetModal();
  };

  const handleRefresh = () => {
    fetchOrderDetail();
    fetchOutstanding();
  };

  // Flattened sets for quick lookup
  const outstandingPkgIds = new Set(outstanding.flatMap((o) => o.packages.map((p) => p.package_id)));
  const outstandingMedIds = new Set(outstanding.map((o) => o.medicine_id._id));

  // Scan Package modal handlers
  const handleOpenPkgModal = () => {
    setPkgInput('');
    setOpenPkgModal(true);
  };
  const handleClosePkgModal = () => setOpenPkgModal(false);

  const handlePkgSubmit = async (e) => {
    e.preventDefault();
    if (!pkgInput) return;

    try {
      // 1) Fetch full package details
      const resp = await axiosInstance.get(`/api/packages/${pkgInput}`, { headers: getAuthHeaders() });
      const { success, data: pkgDetail } = resp.data;
      if (!success) {
        // server said "not a package"
        throw new Error(trans?.common?.invalidPackage || 'Invalid package');
      }

      // 2) Find the export-detail line by medicine_id
      const medId = pkgDetail.batch_id.medicine_id._id;
      const entry = outstanding.find((o) => String(o.medicine_id._id) === String(medId));
      if (!entry) {
        // no matching detail line
        setSnackbar({
          open: true,
          message: trans?.common?.invalidPackageId || 'Invalid package ID',
          severity: trans?.common?.error || 'error'
        });
        return;
      }

      // 3) Build the pkgToProceed object
      const pkgToProceed = {
        package_id: pkgDetail._id,
        batch_id: pkgDetail.batch_id,
        take_quantity: pkgDetail.quantity,
        location: pkgDetail.location_id
      };

      // 4) Open the Proceed modal
      openProceedModal(entry.detail_id, pkgToProceed, entry.needed_quantity);
    } catch (err) {
      // either a network / 404, or the "invalid" we threw
      setSnackbar({
        open: true,
        message: trans?.common?.invalidPackageId || 'Invalid package ID',
        severity: trans?.common?.error || 'error'
      });
    } finally {
      // keep modal open so user can retry; only clear input if you like
      // setOpenPkgModal(false);
    }
  };
  const fetchOrderDetail = async () => {
    try {
      setLoadingOrder(true);
      const resp = await axiosInstance.get(`/api/export-orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      if (!resp.data.success) throw new Error(trans?.common?.failedToLoadExportOrder || 'Failed to load export order');
      setOrder(resp.data.data);
      setPickingDone(resp.data.data.status !== 'approved');
      setIsInternalOrder(resp.data.data.is_internal); // Set the new state
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrder(false);
    }
  };

  // Fetch order
  useEffect(() => {
    if (!orderId) return;
    fetchOrderDetail();
  }, [orderId]);

  // Fetch outstanding
  const fetchOutstanding = async () => {
    try {
      setLoadingOut(true);
      const resp = await axiosInstance.get(`/api/export-orders/${orderId}/packages-needed`, { headers: getAuthHeaders() });
      if (!resp.data.success) throw new Error();
      setOutstanding(resp.data.data.outstanding);

      // For internal orders, automatically open proceed modal if there are outstanding packages
      if (isInternalOrder && resp.data.data.outstanding && resp.data.data.outstanding.length > 0) {
        const firstOutstanding = resp.data.data.outstanding[0];
        if (firstOutstanding.packages && firstOutstanding.packages.length > 0) {
          const firstPackage = firstOutstanding.packages[0];
          // Auto-open proceed modal for internal orders
          openProceedModal(firstOutstanding.detail_id, firstPackage, firstOutstanding.needed_quantity);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingOut(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOutstanding();
  }, [orderId]);

  useEffect(() => {
    if (!proceedOpen || !currentPkg || !order) return;

    (async () => {
      try {
        setLoadingPkgDetail(true);

        // fetch package
        const { data: pkgResp } = await axiosInstance.get(`/api/packages/${currentPkg}`, { headers: getAuthHeaders() });
        if (!pkgResp.success) throw new Error(trans?.common?.failedToLoadPackage || 'Failed to load package');
        const pkg = pkgResp.data;
        setPkgDetail(pkg);

        // compute how much has already been picked from this pkg
        const alreadyPicked = order.details
          .flatMap((d) => d.actual_item || [])
          .filter((i) => String(i.package_id) === String(pkg._id))
          .reduce((sum, i) => sum + i.quantity, 0);

        // compute on‑hand and recommended
        const onHand = pkg.quantity - alreadyPicked;
        setOnHandQty(onHand);
        const rec = Math.min(onHand, neededQty);
        setRecommendedQty(rec);

        // is this package in outstanding?
        const inOutstanding = outstandingPkgIds.has(pkg._id);

        // initialize once
        setPickAmount(inOutstanding ? rec : 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPkgDetail(false);
      }
    })();
  }, [
    proceedOpen,
    currentPkg,
    order, // watch the whole order object
    neededQty
  ]);

  // Fetch packages for location
  const handleLocSubmit = async () => {
    setLoadingLoc(true);
    try {
      const resp = await axiosInstance.get(`/api/packages/location/${locInput}`, {
        headers: getAuthHeaders()
      });
      const payload = resp.data.data;

      // if server returned success=false OR no packages → error
      if (payload.success === false || (payload.success === true && Array.isArray(payload.packages) && payload.packages.length === 0)) {
        setSnackbar({
          open: true,
          message: trans?.common?.invalidOrEmptyLocation || 'Invalid or empty location',
          severity: trans?.common?.error || 'error'
        });
        setLocPackages([]);
        return;
      }

      // otherwise we have real packages
      let pkgs = payload.packages;
      const today = new Date();
      // 1) filter unexpired
      pkgs = pkgs.filter((p) => new Date(p.batch_id.expiry_date) > today);
      setLocPackages(pkgs);
    } catch {
      setLocPackages([]);
    } finally {
      setLoadingLoc(false);
    }
  };

  if (loadingOrder)
    return (
      <Box textAlign="center" py={8}>
        <CircularProgress />
      </Box>
    );
  if (error)
    return (
      <Alert severity="error" sx={{ m: 4 }}>
        {error}
      </Alert>
    );
  if (!order)
    return (
      <Alert severity="info" sx={{ m: 4 }}>
        {trans?.common?.orderNotFound || 'Order not found'}
      </Alert>
    );

  // helper
  const getPickedQty = (detail) => detail.actual_item?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: trans?.common?.fullHeight || '100vh', py: 4 }}>
      <Container>
        <Typography variant="h4" gutterBottom>
          {trans?.common?.exportOrder || 'Export Order'} #{order._id}
          {isInternalOrder && <Chip label={trans?.common?.internalOrder || 'Internal Order'} color="primary" size="small" sx={{ ml: 2 }} />}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {isInternalOrder
            ? trans?.common?.internalOrderDescription ||
              'Internal order - batches are pre-selected. You can directly scan packages to proceed.'
            : trans?.common?.packingAndCountingMedicines || 'Packing and Counting Medicines'}
        </Typography>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans?.common?.orderDetail || 'Order Detail'}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans?.common?.status || 'Status'}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.status || trans?.common?.na || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans?.common?.contract || 'Contract'}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id?.contract_code || trans?.common?.na || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans?.common?.createdBy || 'Created By'}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.created_by?.email.slice(0, -10) || trans?.common?.na || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans?.common?.warehouseManager || 'Warehouse Manager'}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.warehouse_manager_id?.email || trans?.common?.na || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans?.common?.supplier || 'Supplier'}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id?.partner_id?.name || trans?.common?.na || 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" mb={1} fontWeight="bold">
              {trans?.common?.items || 'Items'}:
            </Typography>
            <Stack spacing={1} mb={2}>
              {order.details.map((d) => (
                <Typography key={d._id} variant="body2">
                  • <strong>{d.medicine_id.medicine_name}</strong> ({d.medicine_id.license_code}): {d.expected_quantity}
                </Typography>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disabled={pickingDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{trans?.common?.picking || 'Picking'}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {isInternalOrder ? (
              <Stack direction="row" spacing={1} mb={2}>
                <Button size="small" variant="outlined" onClick={handleOpenPkgModal}>
                  {trans?.common?.scanPackage || 'Scan Package'}
                </Button>
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} mb={2}>
                <Button size="small" variant="outlined" onClick={handleOpenModal}>
                  {trans?.common?.scanLocation || 'Scan Location'}
                </Button>
                <Button size="small" variant="outlined" onClick={handleOpenPkgModal}>
                  {trans?.common?.scanPackage || 'Scan Package'}
                </Button>
                <IconButton size="small" onClick={handleRefresh}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}

            {/* Medicine‐level */}
            {loadingOut ? (
              <Box textAlign="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              order.details.map((detail) => {
                const out = outstanding.find((o) => o.detail_id === detail._id);
                if (!out) return null;
                const picked = getPickedQty(detail),
                  expected = detail.expected_quantity;
                return (
                  <Accordion key={detail._id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {detail.medicine_id.medicine_name} ({detail.medicine_id.license_code}) : {picked}/{expected}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* For internal orders, show simplified package view */}
                      {isInternalOrder ? (
                        <Box>
                          <Typography variant="body2" color="text.secondary" mb={2}>
                            {trans?.common?.internalOrderBatchInfo ||
                              'Internal order - batches are pre-selected. Scan packages to proceed.'}
                          </Typography>
                          {out.packages.map((pkg) => (
                            <Box key={pkg.package_id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 1 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                {pkg.batch_id.batch_code} — {new Date(pkg.batch_id.expiry_date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {trans?.common?.location || 'Location'}: {pkg.location.area_name} - Bay {pkg.location.bay}, Row{' '}
                                {pkg.location.row}, Col {pkg.location.column}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {trans?.common?.takeQty || 'Take Qty'}: {pkg.take_quantity}
                              </Typography>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => openProceedModal(detail._id, pkg, pkg.take_quantity)}
                                sx={{ mt: 1 }}
                              >
                                {trans?.common?.proceed || 'Proceed'}
                              </Button>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        /* Original detailed view for external orders */
                        out.packages.map((pkg) => (
                          <Accordion key={pkg.package_id} sx={{ mb: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography variant="subtitle2">
                                {pkg.batch_id.batch_code} — {new Date(pkg.batch_id.expiry_date).toLocaleDateString()}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>{trans?.common?.bay || 'Bay'}</TableCell>
                                    <TableCell>{trans?.common?.row || 'Row'}</TableCell>
                                    <TableCell>{trans?.common?.column || 'Column'}</TableCell>
                                    <TableCell>{trans?.common?.area || 'Area'}</TableCell>
                                    <TableCell>{trans?.common?.takeQty || 'Take Qty'}</TableCell>
                                    <TableCell>{trans?.common?.action || 'Action'}</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>{pkg.location.bay}</TableCell>
                                    <TableCell>{pkg.location.row}</TableCell>
                                    <TableCell>{pkg.location.column}</TableCell>
                                    <TableCell>{pkg.location.area_name}</TableCell>
                                    <TableCell>{pkg.take_quantity}</TableCell>
                                    <TableCell>
                                      <Button
                                        key={pkg.package_id}
                                        size="small"
                                        variant="contained"
                                        onClick={() => openProceedModal(detail._id, pkg, pkg.take_quantity)}
                                      >
                                        {trans?.common?.proceed || 'Proceed'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </AccordionDetails>
                          </Accordion>
                        ))
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })
            )}
          </AccordionDetails>
        </Accordion>
      </Container>

      {/* Scan Location Modal */}
      <Dialog open={openModal} onClose={() => handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{trans?.common?.scanLocation || 'Scan Location'}</DialogTitle>

        {/* Wrap the content in a form */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLocSubmit();
          }}
        >
          <DialogContent>
            <TextField
              label={trans?.common?.locationId || 'Location ID'}
              fullWidth
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              margin="dense"
              autoFocus
              inputProps={{ maxLength: 24 }}
            />

            {loadingLoc ? (
              <Box textAlign="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              locPackages.length > 0 && (
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{trans?.common?.medicine || 'Medicine'}</TableCell>
                      <TableCell>{trans?.common?.qty || 'Qty'}</TableCell>
                      <TableCell>{trans?.common?.action || 'Action'}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locPackages.map((pkg) => {
                      const pid = pkg._id;
                      const medId = pkg.batch_id.medicine_id._id;
                      const entry = outstanding.find((o) => o.medicine_id._id === medId);
                      let bg = '#f0f0f0'; // {trans.common.grey}
                      if (outstandingPkgIds.has(pid))
                        bg = '#c8e6c9'; // {trans.common.green}
                      else if (outstandingMedIds.has(medId)) bg = '#fff9c4'; // {trans.common.yellow}

                      return (
                        <TableRow key={pid} sx={{ background: bg }}>
                          <TableCell>{pid}</TableCell>
                          <TableCell>
                            {pkg.batch_id.medicine_id.medicine_name}({pkg.batch_id.medicine_id.license_code})
                          </TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>
                            {entry && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  openProceedModal(
                                    entry.detail_id, // the detail to attach inspection to
                                    {
                                      package_id: pid,
                                      location: pkg.location,
                                      batch_id: pkg.batch_id,
                                      quantity: pkg.quantity
                                    },
                                    entry.needed_quantity
                                  )
                                }
                              >
                                {trans?.common?.proceed || 'Proceed'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )
            )}
          </DialogContent>

          <DialogActions>
            {/* this will trigger the form's onSubmit */}
            <Button type="submit" disabled={!locInput || loadingLoc}>
              {trans?.common?.submit || 'Submit'}
            </Button>
            {/* non-submit button */}
            <Button type="button" onClick={handleCloseModal}>
              {trans?.common?.close || 'Close'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={proceedOpen} onClose={closeProceedModal} fullWidth maxWidth="xs">
        <DialogTitle>{trans?.common?.verifyPackageAndPickAmount || 'Verify Package and Pick Amount'}</DialogTitle>
        <Box component="form" onSubmit={handleProceedSubmit}>
          <DialogContent>
            {loadingPkgDetail ? (
              <Box textAlign="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : pkgDetail ? (
              <>
                {/* Package Info */}
                <Stack spacing={1} mb={2}>
                  <Typography>
                    <strong>{trans?.common?.medicine || 'Medicine'}:</strong> {pkgDetail.batch_id.medicine_id.medicine_name}
                  </Typography>
                  <Typography>
                    <strong>{trans?.common?.licenseCode || 'License Code'}:</strong> {pkgDetail.batch_id.medicine_id.license_code}
                  </Typography>
                  <Typography>
                    <strong>{trans?.common?.batchCode || 'Batch Code'}:</strong> {pkgDetail.batch_id.batch_code}
                  </Typography>
                  <Typography>
                    <strong>{trans?.common?.expiry || 'Expiry'}:</strong> {new Date(pkgDetail.batch_id.expiry_date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>{trans?.common?.onHandQty || 'On Hand Qty'}:</strong> {onHandQty}
                  </Typography>
                  <Typography>
                    <strong>{trans?.common?.recommended || 'Recommended'}:</strong> {recommendedQty}
                  </Typography>
                </Stack>

                {/* Package‑ID Status Chip */}
                <Box sx={{ mb: 1 }}>
                  {(() => {
                    let label, color;
                    if (!verifyInput) {
                      label = trans?.common?.enterPackageId || 'Enter Package ID';
                      color = trans?.common?.default || 'default';
                    } else if (verifyInput === String(pkgDetail._id)) {
                      label = trans?.common?.validPackageId || 'Valid Package ID';
                      color = trans?.common?.success || 'success';
                    } else {
                      label = trans?.common?.invalidPackageId || 'Invalid Package ID';
                      color = trans?.common?.error || 'error';
                    }
                    return <Chip label={label} color={color} size="small" />;
                  })()}
                </Box>

                {/* Verification Input */}
                <Typography variant="body2" gutterBottom>
                  {trans?.common?.pleaseScanOrEnterPackageId || 'Please scan or enter the package ID'}
                </Typography>
                <TextField
                  label={trans?.common?.packageId || 'Package ID'}
                  fullWidth
                  margin="dense"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value.trim())}
                  autoFocus
                  inputProps={{ maxLength: 24 }}
                />

                {/* Pick Quantity Input */}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {trans?.common?.enterAmountToPick || 'Enter amount to pick'} (max {Math.min(onHandQty, neededQty)}):
                </Typography>
                <TextField
                  label={trans?.common?.pickQuantity || 'Pick Quantity'}
                  type="number"
                  fullWidth
                  margin="dense"
                  value={pickAmount}
                  onChange={(e) => setPickAmount(Number(e.target.value))}
                  disabled={verifyInput !== String(pkgDetail._id)}
                  inputProps={{
                    min: 1,
                    max: Math.min(onHandQty, neededQty)
                  }}
                />
              </>
            ) : (
              <Alert severity="error">{trans?.common?.unableToLoadPackageDetails || 'Unable to load package details'}</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              disabled={
                verifyInput !== String(pkgDetail?._id) || pickAmount < 1 || pickAmount > Math.min(pkgDetail?.quantity || 0, neededQty)
              }
            >
              {trans?.common?.submit || 'Submit'}
            </Button>
            <Button onClick={closeProceedModal}>{trans?.common?.cancel || 'Cancel'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Scan Package Modal */}
      <Dialog open={openPkgModal} onClose={handleClosePkgModal} fullWidth maxWidth="sm">
        <DialogTitle>{trans?.common?.scanPackage || 'Scan Package'}</DialogTitle>
        <Box component="form" onSubmit={handlePkgSubmit}>
          <DialogContent>
            <TextField
              label={trans?.common?.packageId || 'Package ID'}
              fullWidth
              value={pkgInput}
              onChange={(e) => setPkgInput(e.target.value.trim())}
              autoFocus
              margin="dense"
              inputProps={{ maxLength: 24 }}
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" variant="contained" disabled={!pkgInput}>
              {trans?.common?.submit || 'Submit'}
            </Button>
            <Button type="button" onClick={handleClosePkgModal}>
              {trans?.common?.cancel || 'Cancel'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
        anchorOrigin={{ vertical: trans?.common?.bottom || 'bottom', horizontal: trans?.common?.center || 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
          severity={snackbar.severity}
          sx={{ width: trans?.common?.fullWidth || '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
