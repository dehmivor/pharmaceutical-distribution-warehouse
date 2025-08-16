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

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': trans.common.contentType,
    ...(token && { Authorization: `${trans.common.bearer} ${token}` })
  };
};

export default function ExportOrderDetail() {
  const theme = useTheme();
  const trans = useTrans();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingOut, setLoadingOut] = useState(false);
  const [error, setError] = useState(null);
  const [pickingDone, setPickingDone] = useState(false);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [locInput, setLocInput] = useState(trans.common.emptyMessage);
  const [locPackages, setLocPackages] = useState([]);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const [proceedOpen, setProceedOpen] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(null);
  const [neededQty, setNeededQty] = useState(0);
  const [verifyInput, setVerifyInput] = useState(trans.common.emptyMessage);
  const [pickAmount, setPickAmount] = useState(0);
  const [currentDetailId, setCurrentDetailId] = useState(null);

  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || trans.common.emptyObject) : {};
  const userId = userData.userId;

  // Scan Package modal state
  const [openPkgModal, setOpenPkgModal] = useState(false);
  const [pkgInput, setPkgInput] = useState(trans.common.emptyMessage);

  const [pkgDetail, setPkgDetail] = useState(null);
  const [loadingPkgDetail, setLoadingPkgDetail] = useState(false);
  const [onHandQty, setOnHandQty] = useState(0);
  const [recommendedQty, setRecommendedQty] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
            message: trans.common.emptyMessage,
    severity: trans.common.error
  });

  // Handler to open the Proceed modal
  const openProceedModal = (detailId, pkg, needed) => {
    setCurrentDetailId(detailId);
    setCurrentPkg(pkg.package_id); // only store the ID
    setNeededQty(needed);
    setVerifyInput(trans.common.emptyMessage);
    setProceedOpen(true);
    handleCloseModal();
  };

  const closeProceedModal = () => {
    setProceedOpen(false);
    setCurrentPkg(null);
    setVerifyInput(trans.common.emptyMessage);
  };

  const handleProceedSubmit = async (e) => {
    e.preventDefault();

    if (!pkgDetail || verifyInput !== String(pkgDetail._id)) {
              console.warn(trans.common.cannotSubmitInvalidPackage);
      return;
    }

    try {
      const pkgId = pkgDetail._id;

      await axios.post(
        `/api/export-orders/${orderId}/details/${currentDetailId}/inspections`,
        {
          package_id: pkgId,
          quantity: pickAmount,
          user_id: userId
        },
        { headers: getAuthHeaders() }
      );

      // Close modal & refresh outstanding list
      closeProceedModal();
      handleRefresh();
    } catch (err) {
      console.error('Error creating inspection:', err);
      // Optionally show user feedback here:
      // setSnackbar({ open: true, message: err.response?.data?.message || err.message, severity: 'error' });
    }
  };

  // reset modal state
  const resetModal = () => {
    setLocInput(trans.common.emptyMessage);
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
    setPkgInput(trans.common.emptyMessage);
    setOpenPkgModal(true);
  };
  const handleClosePkgModal = () => setOpenPkgModal(false);

  const handlePkgSubmit = async (e) => {
    e.preventDefault();
    if (!pkgInput) return;

    try {
      // 1) Fetch full package details
      const resp = await axios.get(`/api/packages/${pkgInput}`, { headers: getAuthHeaders() });
      const { success, data: pkgDetail } = resp.data;
      if (!success) {
        // server said "not a package"
        throw new Error(trans.common.invalidPackage);
      }

      // 2) Find the export-detail line by medicine_id
      const medId = pkgDetail.batch_id.medicine_id._id;
      const entry = outstanding.find((o) => String(o.medicine_id._id) === String(medId));
      if (!entry) {
        // no matching detail line
        setSnackbar({
          open: true,
          message: trans.common.invalidPackageId,
          severity: trans.common.error
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
        message: trans.common.invalidPackageId,
        severity: trans.common.error
      });
    } finally {
      // keep modal open so user can retry; only clear input if you like
      // setOpenPkgModal(false);
    }
  };
  const fetchOrderDetail = async () => {
    try {
      setLoadingOrder(true);
      const resp = await axios.get(`/api/export-orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      if (!resp.data.success) throw new Error(trans.common.failedToLoadExportOrder);
      setOrder(resp.data.data);
      setPickingDone(resp.data.data.status !== trans.common.approved);
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
      const resp = await axios.get(`/api/export-orders/${orderId}/packages-needed`, { headers: getAuthHeaders() });
      if (!resp.data.success) throw new Error();
      setOutstanding(resp.data.data.outstanding);
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
        const { data: pkgResp } = await axios.get(`/api/packages/${currentPkg}`, { headers: getAuthHeaders() });
        if (!pkgResp.success) throw new Error(trans.common.failedToLoadPackage);
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
      const resp = await axios.get(`/api/packages/location/${locInput}`, {
        headers: getAuthHeaders()
      });
      const payload = resp.data.data;

      // if server returned success=false OR no packages → error
      if (payload.success === false || (payload.success === true && Array.isArray(payload.packages) && payload.packages.length === 0)) {
        setSnackbar({
          open: true,
          message: trans.common.invalidOrEmptyLocation,
          severity: trans.common.error
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
        {trans.common.orderNotFound}
      </Alert>
    );

  // helper
  const getPickedQty = (detail) => detail.actual_item?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
          <Box sx={{ background: theme.palette.background.default, minHeight: trans.common.fullHeight, py: 4 }}>
      <Container>
        <Typography variant="h4" gutterBottom>
          {trans.common.exportOrder} #{order._id}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          {trans.common.packingAndCountingMedicines}
        </Typography>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{trans.common.orderDetail}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.common.status}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.status || trans.common.na}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.common.contract}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id?.contract_code || trans.common.na}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.common.createdBy}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.created_by?.email.slice(0, -10) || trans.common.na}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.common.warehouseManager}
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.warehouse_manager_id?.email || trans.common.na}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.common.supplier}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id?.partner_id?.name || trans.common.na}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" mb={1} fontWeight="bold">
              {trans.common.items}:
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
            <Typography>{trans.common.picking}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} mb={2}>
              <Button size="small" variant="outlined" onClick={handleOpenModal}>
                {trans.common.scanLocation}
              </Button>
              <Button size="small" variant="outlined" onClick={handleOpenPkgModal}>
                {trans.common.scanPackage}
              </Button>
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>

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
                      {/* Batch‐level */}
                      {out.packages.map((pkg) => (
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
                                  <TableCell>{trans.common.bay}</TableCell>
                                  <TableCell>{trans.common.row}</TableCell>
                                  <TableCell>{trans.common.column}</TableCell>
                                  <TableCell>{trans.common.area}</TableCell>
                                  <TableCell>{trans.common.takeQty}</TableCell>
                                  <TableCell>{trans.common.action}</TableCell>
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
                                      {trans.common.proceed}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </AccordionDetails>
                        </Accordion>
                      ))}
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
        <DialogTitle>{trans.common.scanLocation}</DialogTitle>

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
              label={trans.common.locationId}
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
                      <TableCell>{trans.common.medicine}</TableCell>
                      <TableCell>{trans.common.qty}</TableCell>
                      <TableCell>{trans.common.action}</TableCell>
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
                                {trans.common.proceed}
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
              {trans.common.submit}
            </Button>
            {/* non-submit button */}
            <Button type="button" onClick={handleCloseModal}>
              {trans.common.close}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={proceedOpen} onClose={closeProceedModal} fullWidth maxWidth="xs">
        <DialogTitle>{trans.common.verifyPackageAndPickAmount}</DialogTitle>
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
                    <strong>{trans.common.medicine}:</strong> {pkgDetail.batch_id.medicine_id.medicine_name}
                  </Typography>
                  <Typography>
                    <strong>{trans.common.licenseCode}:</strong> {pkgDetail.batch_id.medicine_id.license_code}
                  </Typography>
                  <Typography>
                    <strong>{trans.common.batchCode}:</strong> {pkgDetail.batch_id.batch_code}
                  </Typography>
                  <Typography>
                    <strong>{trans.common.expiry}:</strong> {new Date(pkgDetail.batch_id.expiry_date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>{trans.common.onHandQty}:</strong> {onHandQty}
                  </Typography>
                  <Typography>
                    <strong>{trans.common.recommended}:</strong> {recommendedQty}
                  </Typography>
                </Stack>

                {/* Package‑ID Status Chip */}
                <Box sx={{ mb: 1 }}>
                  {(() => {
                    let label, color;
                    if (!verifyInput) {
                      label = trans.common.enterPackageId;
                      color = trans.common.default;
                    } else if (verifyInput === String(pkgDetail._id)) {
                      label = trans.common.validPackageId;
                      color = trans.common.success;
                    } else {
                      label = trans.common.invalidPackageId;
                      color = trans.common.error;
                    }
                    return <Chip label={label} color={color} size="small" />;
                  })()}
                </Box>

                {/* Verification Input */}
                <Typography variant="body2" gutterBottom>
                  {trans.common.pleaseScanOrEnterPackageId}
                </Typography>
                <TextField
                  label={trans.common.packageId}
                  fullWidth
                  margin="dense"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value.trim())}
                  autoFocus
                  inputProps={{ maxLength: 24 }}
                />

                {/* Pick Quantity Input */}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {trans.common.enterAmountToPick} (max {Math.min(onHandQty, neededQty)}):
                </Typography>
                <TextField
                  label={trans.common.pickQuantity}
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
              <Alert severity="error">{trans.common.unableToLoadPackageDetails}</Alert>
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
              {trans.common.submit}
            </Button>
            <Button onClick={closeProceedModal}>{trans.common.cancel}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Scan Package Modal */}
      <Dialog open={openPkgModal} onClose={handleClosePkgModal} fullWidth maxWidth="sm">
        <DialogTitle>{trans.common.scanPackage}</DialogTitle>
        <Box component="form" onSubmit={handlePkgSubmit}>
          <DialogContent>
            <TextField
              label={trans.common.packageId}
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
              {trans.common.submit}
            </Button>
            <Button type="button" onClick={handleClosePkgModal}>
              {trans.common.cancel}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
        anchorOrigin={{ vertical: trans.common.bottom, horizontal: trans.common.center }}
      >
        <Alert onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))} severity={snackbar.severity} sx={{ width: trans.common.fullWidth }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
