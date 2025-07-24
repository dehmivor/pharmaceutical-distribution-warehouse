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
  DialogActions, TextField
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

  // Handler to open the Proceed modal
  const openProceedModal = (detailId, pkg, needed) => {
    setCurrentDetailId(detailId);
    setCurrentPkg(pkg);
    setNeededQty(needed);
    setPickAmount(needed);
    setVerifyInput('');
    setProceedOpen(true);
  };

  const closeProceedModal = () => {
    setProceedOpen(false);
    setCurrentPkg(null);
    setVerifyInput('');
  };


  const handleProceedSubmit = async e => {
    e.preventDefault();
    try {
      // disable double‐submits
      if (!verifyInput || verifyInput !== String(currentPkg.package_id)) return;

      await axios.post(
        `/api/export-orders/${orderId}/details/${currentDetailId}/inspections`,
        {
          package_id: currentPkg.package_id,
          quantity: pickAmount, user_id: userId
        },
        { headers: getAuthHeaders() }
      );

      // close and reload outstanding
      closeProceedModal();
      fetchOutstanding();
    } catch (err) {
      console.error('Error creating inspection:', err);
      // you can show a snackbar or set an error state here
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
              <Button size="small" variant="outlined">Scan Package</Button>
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
                        <Accordion key={pkg.batch_id._id} sx={{ mb: 1 }}>
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
                      <TableCell>Package ID</TableCell>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {locPackages.map(pkg => {
                      const pid = pkg._id;
                      const medId = pkg.batch_id.medicine_id._id;
                      let bg = '#f0f0f0'; // grey
                      if (outstandingPkgIds.has(pid)) bg = '#c8e6c9'; // green
                      else if (outstandingMedIds.has(medId)) bg = '#fff9c4'; // yellow

                      return (
                        <TableRow key={pid} sx={{ background: bg }}>
                          <TableCell>{pid}</TableCell>
                          <TableCell>{pkg.batch_id.medicine_id.medicine_name}</TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>
                            {(outstandingPkgIds.has(pid) || outstandingMedIds.has(medId)) && (
                              <Button size="small" variant="contained">Proceed</Button>
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


      {/* Proceed Modal */}
      <Dialog open={proceedOpen} onClose={closeProceedModal} fullWidth maxWidth="xs">
        <DialogTitle>Verify Package & Pick Amount</DialogTitle>

        <Box component="form" onSubmit={handleProceedSubmit}>
          <DialogContent>
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

            <Typography variant="body2" sx={{ mt: 2 }}>
              Enter amount to pick (max {neededQty}):
            </Typography>
            <TextField
              label="Pick Quantity"
              type="number"
              fullWidth
              margin="dense"
              value={pickAmount}
              onChange={e => setPickAmount(Number(e.target.value))}
              disabled={verifyInput !== String(currentPkg?.package_id)}
              inputProps={{ min: 1, max: neededQty }}
            />
          </DialogContent>

          <DialogActions>
            <Button
              type="submit"
              variant="contained"
              disabled={verifyInput !== String(currentPkg?.package_id)}
            >
              Submit
            </Button>
            <Button type="button" onClick={closeProceedModal}>
              Cancel
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
