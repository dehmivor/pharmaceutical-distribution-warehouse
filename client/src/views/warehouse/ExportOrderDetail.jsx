'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Box, Button, Container, Divider, Stack,
  Typography, CircularProgress, Alert, Table,
  TableHead, TableBody, TableRow, TableCell,
  IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip
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

export default function ExportOrderDetail() {
  const theme = useTheme();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [outstanding, setOutstanding] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [loadingOut, setLoadingOut] = useState(false);
  const [error, setError] = useState(null);
  const [pickingDone, setPickingDone] = useState(false);

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


  // Handler to open the Proceed modal
  const openProceedModal = (detailId, pkg, needed) => {
    setCurrentDetailId(detailId);
    setCurrentPkg(pkg.package_id);         // only store the ID
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


  const handleProceedSubmit = async e => {
  e.preventDefault();

  if (!pkgDetail || verifyInput !== String(pkgDetail._id)) {
    console.warn('Cannot submit: invalid or missing package');
    return;
  }

  try {
    const pkgId = pkgDetail._id;

    await axios.post(
      `/api/export-orders/${orderId}/details/${currentDetailId}/inspections`,
      {
        package_id: pkgId,
        quantity: pickAmount,
        user_id: userId,
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
  const outstandingPkgIds = new Set(
    outstanding.flatMap(o => o.packages.map(p => p.package_id))
  );
  const outstandingMedIds = new Set(outstanding.map(o => o.medicine_id._id));


  // Scan Package modal handlers
  const handleOpenPkgModal = () => { setPkgInput(''); setOpenPkgModal(true); };
  const handleClosePkgModal = () => setOpenPkgModal(false);


  const handlePkgSubmit = async e => {
    e.preventDefault();
    if (!pkgInput) return;

    try {
      // 1) Fetch full package details
      const { data: { success, data: pkgDetail } } = await axios.get(
        `/api/packages/${pkgInput}`,
        { headers: getAuthHeaders() }
      );
      if (!success) throw new Error('Package not found');

      // 2) Find the export-detail line by medicine_id
      const medId = pkgDetail.batch_id.medicine_id._id;
      const entry = outstanding.find(o =>
        String(o.medicine_id._id) === String(medId)
      );
      if (!entry) {
        // No matching line → you could show an error here, but still close modal
        setOpenPkgModal(false);
        return;
      }

      // 3) Build the pkgToProceed object (always use pkgDetail)
      const pkgToProceed = {
        package_id: pkgDetail._id,
        batch_id: pkgDetail.batch_id,
        take_quantity: pkgDetail.quantity,
        location: pkgDetail.location_id
      };

      // 4) **Always** open the Proceed modal
      openProceedModal(entry.detail_id, pkgToProceed, entry.needed_quantity);
    } catch (err) {
      console.error('Error fetching package:', err);
    } finally {
      setOpenPkgModal(false);
    }
  };

  const fetchOrderDetail = async () => {
    try {
      setLoadingOrder(true);
      const resp = await axios.get(`/api/export-orders/${orderId}`, {
        headers: getAuthHeaders()
      });
      if (!resp.data.success) throw new Error('Failed to load export order');
      setOrder(resp.data.data);
      setPickingDone(resp.data.data.status !== 'approved');
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
      const resp = await axios.get(
        `/api/export-orders/${orderId}/packages-needed`,
        { headers: getAuthHeaders() }
      );
      if (!resp.data.success) throw new Error();
      setOutstanding(resp.data.data.outstanding);
    } catch {
      // ignore
    } finally {
      setLoadingOut(false);
    }
  };

  useEffect(() => { if (orderId) fetchOutstanding(); }, [orderId]);

  useEffect(() => {
    if (!proceedOpen || !currentPkg || !order) return;

    (async () => {
      try {
        setLoadingPkgDetail(true);

        // fetch package
        const { data: pkgResp } = await axios.get(
          `/api/packages/${currentPkg}`,
          { headers: getAuthHeaders() }
        );
        if (!pkgResp.success) throw new Error('Failed to load pkg');
        const pkg = pkgResp.data;
        setPkgDetail(pkg);

        // compute how much has already been picked from this pkg
        const alreadyPicked = order.details
          .flatMap(d => d.actual_item || [])
          .filter(i => String(i.package_id) === String(pkg._id))
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
    order,               // watch the whole order object
    neededQty,
  ]);



  // Fetch packages for location
  const handleLocSubmit = async () => {
    setLoadingLoc(true);
    try {
      const resp = await axios.get(`/api/packages/location/${locInput}`, {
        headers: getAuthHeaders()
      });
      let pkgs = resp.data.data.packages || [];
      const today = new Date();
      // 1) filter unexpired
      pkgs = pkgs.filter(p => new Date(p.batch_id.expiry_date) > today);
      setLocPackages(pkgs);
    } catch {
      setLocPackages([]);
    } finally {
      setLoadingLoc(false);
    }
  };

  if (loadingOrder) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!order) return <Alert severity="info" sx={{ m: 4 }}>Order not found</Alert>;

  // helper
  const getPickedQty = detail =>
    detail.actual_item?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        {/* Order Detail */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Order Detail</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography><strong>Status:</strong> {order.status}</Typography>
            <Typography><strong>Contract Code:</strong> {order.contract_id.contract_code}</Typography>
            <Typography><strong>Created By:</strong> {order.created_by.email}</Typography>
            <Typography>
              <strong>Warehouse Manager:</strong> {order.warehouse_manager_id?.email || 'N/A'}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography><strong>Items:</strong></Typography>
            {order.details.map(d => (
              <Typography key={d._id}>
                • {d.medicine_id.medicine_name} ({d.medicine_id.license_code}): {d.expected_quantity}
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>

        <Accordion disabled={pickingDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Picking</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack direction="row" spacing={1} mb={2}>
              <Button
                size="small"
                variant="outlined"
                onClick={handleOpenModal}
              >Scan Location</Button>
              <Button size="small" variant="outlined" onClick={handleOpenPkgModal}>Scan Package</Button>
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Medicine‐level */}
            {loadingOut
              ? <Box textAlign="center" py={4}><CircularProgress /></Box>
              : order.details.map(detail => {
                const out = outstanding.find(o => o.detail_id === detail._id);
                if (!out) return null;
                const picked = getPickedQty(detail),
                  expected = detail.expected_quantity;
                return (
                  <Accordion key={detail._id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        {detail.medicine_id.medicine_name} ({detail.medicine_id.license_code})
                        : {picked}/{expected}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* Batch‐level */}
                      {out.packages.map(pkg => (
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
                                  <TableCell>Bay</TableCell>
                                  <TableCell>Row</TableCell>
                                  <TableCell>Column</TableCell>
                                  <TableCell>Area</TableCell>
                                  <TableCell>Take Qty</TableCell>
                                  <TableCell>Action</TableCell>
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
                                      Proceed
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
            }
          </AccordionDetails>
        </Accordion>
      </Container>

      {/* Scan Location Modal */}
      <Dialog open={openModal} onClose={() => handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>Scan Location</DialogTitle>

        {/* Wrap the content in a form */}
        <Box
          component="form"
          onSubmit={e => {
            e.preventDefault();
            handleLocSubmit();
          }}
        >
          <DialogContent>
            <TextField
              label="Location ID"
              fullWidth
              value={locInput}
              onChange={e => setLocInput(e.target.value)}
              margin="dense"
              // so Enter in this field submits
              autoFocus
            />

            {loadingLoc
              ? <Box textAlign="center" py={2}><CircularProgress size={24} /></Box>
              : locPackages.length > 0 && (
                <Table size="small" sx={{ mt: 2 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locPackages.map(pkg => {
                      const pid = pkg._id;
                      const medId = pkg.batch_id.medicine_id._id;
                      const entry = outstanding.find(o => o.medicine_id._id === medId)
                      let bg = '#f0f0f0'; // grey
                      if (outstandingPkgIds.has(pid)) bg = '#c8e6c9'; // green
                      else if (outstandingMedIds.has(medId)) bg = '#fff9c4'; // yellow

                      return (
                        <TableRow key={pid} sx={{ background: bg }}>
                          <TableCell>{pid}</TableCell>
                          <TableCell>{pkg.batch_id.medicine_id.medicine_name}({pkg.batch_id.medicine_id.license_code})</TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>
                            {entry && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() =>
                                  openProceedModal(
                                    entry.detail_id,   // the detail to attach inspection to
                                    {
                                      package_id: pid,
                                      location: pkg.location,
                                      batch_id: pkg.batch_id,
                                      quantity: pkg.quantity,
                                    },
                                    entry.needed_quantity
                                  )
                                }
                              >
                                Proceed
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
          </DialogContent>

          <DialogActions>
            {/* this will trigger the form’s onSubmit */}
            <Button type="submit" disabled={!locInput || loadingLoc}>
              Submit
            </Button>
            {/* non-submit button */}
            <Button type="button" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogActions>
        </Box>
      </Dialog>


      <Dialog open={proceedOpen} onClose={closeProceedModal} fullWidth maxWidth="xs">
        <DialogTitle>Verify Package & Pick Amount</DialogTitle>
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
                    <strong>Medicine:</strong>{" "}
                    {pkgDetail.batch_id.medicine_id.medicine_name}
                  </Typography>
                  <Typography>
                    <strong>License Code:</strong>{" "}
                    {pkgDetail.batch_id.medicine_id.license_code}
                  </Typography>
                  <Typography>
                    <strong>Batch Code:</strong> {pkgDetail.batch_id.batch_code}
                  </Typography>
                  <Typography>
                    <strong>Expiry:</strong>{" "}
                    {new Date(pkgDetail.batch_id.expiry_date).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    <strong>On‑hand Qty:</strong> {onHandQty}
                  </Typography>
                  <Typography>
                    <strong>Recommended:</strong> {recommendedQty}
                  </Typography>
                </Stack>

                {/* Package‑ID Status Chip */}
                <Box sx={{ mb: 1 }}>
                  {(() => {
                    let label, color;
                    if (!verifyInput) {
                      label = "Enter package ID";
                      color = "default";
                    } else if (verifyInput === String(pkgDetail._id)) {
                      label = "Valid package ID";
                      color = "success";
                    } else {
                      label = "Invalid package ID";
                      color = "error";
                    }
                    return <Chip label={label} color={color} size="small" />;
                  })()}
                </Box>

                {/* Verification Input */}
                <Typography variant="body2" gutterBottom>
                  Please scan or enter the Package ID to verify:
                </Typography>
                <TextField
                  label="Package ID"
                  fullWidth
                  margin="dense"
                  value={verifyInput}
                  onChange={e => setVerifyInput(e.target.value.trim())}
                  autoFocus
                />

                {/* Pick Quantity Input */}
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Enter amount to pick (max {Math.min(onHandQty, neededQty)}):
                </Typography>
                <TextField
                  label="Pick Quantity"
                  type="number"
                  fullWidth
                  margin="dense"
                  value={pickAmount}
                  onChange={e => setPickAmount(Number(e.target.value))}
                  disabled={verifyInput !== String(pkgDetail._id)}
                  inputProps={{
                    min: 1,
                    max: Math.min(onHandQty, neededQty),
                  }}
                />
              </>
            ) : (
              <Alert severity="error">Unable to load package details.</Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              disabled={
                verifyInput !== String(pkgDetail?._id)
                || pickAmount < 1
                || pickAmount > Math.min(pkgDetail?.quantity || 0, neededQty)
              }
            >
              Submit
            </Button>
            <Button onClick={closeProceedModal}>Cancel</Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Scan Package Modal */}
      <Dialog open={openPkgModal} onClose={handleClosePkgModal} fullWidth maxWidth="sm">
        <DialogTitle>Scan Package</DialogTitle>
        <Box component="form" onSubmit={handlePkgSubmit}>
          <DialogContent>
            <TextField
              label="Package ID"
              fullWidth
              value={pkgInput}
              onChange={e => setPkgInput(e.target.value.trim())}
              autoFocus
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button type="submit" variant="contained" disabled={!pkgInput}>Submit</Button>
            <Button type="button" onClick={handleClosePkgModal}>Cancel</Button>
          </DialogActions>
        </Box>
      </Dialog>

    </Box>
  );
}
