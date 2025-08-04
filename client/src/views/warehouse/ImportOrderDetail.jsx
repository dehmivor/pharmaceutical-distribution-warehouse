'use client';

import bwipjs from 'bwip-js/browser';
import ReceiptIcon from '@mui/icons-material/Receipt';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Container,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableContainer,
  TableCell,
  Tooltip,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddBoxIcon from '@mui/icons-material/AddBox';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
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

function ImportOrderDetail() {
  const theme = useTheme();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inspectionsDone, setInspectionsDone] = useState(false);
  const [putAwayDone, setPutAwayDone] = useState(false);

  const [putAway, setPutAway] = useState([]);
  const [loadingPutAway, setLoadingPutAway] = useState(false);

  const [putAwayModalOpen, setPutAwayModalOpen] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(null);

  const [areas, setAreas] = useState([]);
  const [locForm, setLocForm] = useState({
    location_id: '',
    area_id: '',
    bay: '',
    row: '',
    level: ''
  });
  const [locError, setLocError] = useState(null);

  const [relatedModalOpen, setRelatedModalOpen] = useState(false);
  const [relatedBatchLocs, setRelatedBatchLocs] = useState([]);
  const [relatedMedLocs, setRelatedMedLocs] = useState([]);
  const [relatedError, setRelatedError] = useState(null);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchPackageId, setSearchPackageId] = useState('');
  const [highlightedPkgId, setHighlightedPkgId] = useState(null);

  const fetchPutAway = async () => {
    try {
      setLoadingPutAway(true);
      const resp = await axios.get(`/api/packages/import-order/${orderId}`, {
        headers: getAuthHeaders()
      });
      const list = Array.isArray(resp.data.data) ? resp.data.data : [];
      setPutAway(list);
    } catch (err) {
      console.error(err);
      setPutAway([]);
    } finally {
      setLoadingPutAway(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!orderId) return;

    (async () => {
      try {
        setLoading(true);

        // 1) Load the order
        const { data: orderResp } = await axios.get(`/api/import-orders/${orderId}`, { headers: getAuthHeaders() });
        if (!orderResp.success) {
          throw new Error('Failed to load order');
        }
        setOrder(orderResp.data);

        // 2) Load “put away” packages
        await fetchPutAway();

        // 3) Fetch all areas
        const {
          data: { data: { areas: areaList = [] } = {} }
        } = await axios.get('/api/areas', { headers: getAuthHeaders() });
        setAreas(areaList);

        // 4) Enable/disable accordions based on status
        switch (orderResp.data.status) {
          case 'delivered':
            enableAccordion('delivered');
            break;
          case 'arranged':
            enableAccordion('packaged');
            break;
          default:
            enableAccordion('other');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const enableAccordion = async (orderState) => {
    if (orderState == 'other') {
      setInspectionsDone(true);
      setPutAwayDone(true);
    }
    if (orderState == 'delivered') {
      setInspectionsDone(false);
      setPutAwayDone(true);
    }
    if (orderState == 'packaged') {
      setInspectionsDone(true);
      setPutAwayDone(false);
    }
  };

  const handleShowRelated = async (pkg) => {
    try {
      setRelatedError(null);
      const { data } = await axios.get(`/api/packages/${pkg._id}/related-locations`, { headers: getAuthHeaders() });
      setRelatedBatchLocs(data.data.sameBatchLocations);
      setRelatedMedLocs(data.data.sameMedicineLocations);
      setRelatedModalOpen(true);
    } catch (err) {
      console.error(err);
      setRelatedError(err.response?.data?.message || err.message);
    }
  };

  const openPutAwayModal = (pkg) => {
    setCurrentPkg(pkg);
    setLocForm({ location_id: '', area_id: '', bay: '', row: '', level: '' });
    setLocError(null);
    setPutAwayModalOpen(true);
  };
  const closePutAwayModal = () => setPutAwayModalOpen(false);

  // Auto‑fill by location_id
  const handleLookupLocation = async () => {
    try {
      const { location_id } = locForm;
      if (!location_id) throw new Error('Enter a location ID');
      const r = await axios.get(`/api/locations/${location_id}`, { headers: getAuthHeaders() });
      const loc = r.data.data;
      setLocForm({
        location_id,
        area_id: loc.area_id._id,
        bay: loc.bay,
        row: loc.row,
        level: loc.column
      });
    } catch (err) {
      setLocError(err.response?.data?.message || err.message);
    }
  };

  // Pressing Enter in the location_id field
  const onLocationKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookupLocation();
    }
  };

  // Submit put-away
  const handleSubmitPutAway = async () => {
    try {
      const { location_id } = locForm;
      // Grab the current warehouse user and the import‑order ID
      const ware_house_id = userId; // or wherever you keep the logged‑in user’s ID
      const import_order_id = order._id;

      await axios.patch(
        `/api/packages/${currentPkg._id}/location`,
        {
          location_id,
          ware_house_id,
          import_order_id
        },
        { headers: getAuthHeaders() }
      );
      await fetchPutAway();
      closePutAwayModal();
    } catch (err) {
      setLocError(err.response?.data?.message || err.message);
    }
  };

  const handlePrintLabel = async (pkg) => {
    try {
      console.log(pkg);

      const pkgId = pkg._id;
      const batchId = pkg.batch_id._id;
      const batchCode = pkg.batch_id.batch_code;
      const expDate = pkg.batch_id.expiry_date?.slice(0, 10) || 'N/A';
      const orderIdStr = order._id;
      const supplierName = order.contract_id?.partner_id?.name || 'N/A';

      // Fetch medicine details
      const med = pkg.batch_id?.medicine_id;
      const medicineLabel = med ? `${med.medicine_name} (${med.license_code})` : 'Unknown Medicine';

      // Render barcode to offscreen canvas
      const canvas = document.createElement('canvas');
      await bwipjs.toCanvas(canvas, {
        bcid: 'qrcode', // use the QR‑code generator
        text: pkgId, // data to encode
        scale: 6, // how many pixels per “module”
        version: 5, // 1–40, controls size; omit to auto‑fit
        eclevel: 'M', // error‑correction: L, M, Q, H
        includeMargin: true // add a quiet zone around the code
      });
      const barcodeDataUrl = canvas.toDataURL('image/png');

      // Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      // Write label HTML into it
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.open();
      doc.write(`
      <html>
        <head>
          <style>
            body { font-family: sans-serif; margin: 0; padding: 10px; font-size: x-large; }
            img { display: block; margin: auto; max-width: 100%; }
            .field { margin: 4px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <img src="${barcodeDataUrl}" alt="Barcode" />
          <br/>
          <div class="field"><span class="label">Package ID:</span> ${pkgId}</div>
          <div class="field"><span class="label">Medicine:</span> ${medicineLabel}</div>
          <div class="field"><span class="label">Batch:</span> ${batchCode}</div>
          <div class="field"><span class="label">EXP:</span> ${expDate}</div>
          <div class="field"><span class="label">Import Order:</span> ${orderIdStr}</div>
          <div class="field"><span class="label">Supplier:</span> ${supplierName}</div>
        </body>
      </html>
    `);
      doc.close();

      // Trigger print and cleanup
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 0);
      };
    } catch (err) {
      console.error('Error printing label', err);
      setError('Không thể tạo nhãn mã vạch.');
    }
  };

  const unarranged = putAway.filter((p) => !p.location_id);
  const arranged = putAway.filter((p) => !!p.location_id);

  const openSearchModal = () => {
    setSearchPackageId('');
    setSearchModalOpen(true);
  };
  const closeSearchModal = () => {
    setSearchModalOpen(false);
  };
  const handleSearchSubmit = () => {
    const exists = putAway.some((p) => p._id === searchPackageId);
    setHighlightedPkgId(exists ? searchPackageId : null);
    closeSearchModal();
  };

  if (loading)
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
        Order not found
      </Alert>
    );

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h4" gutterBottom>
          Import Order #{order._id}
        </Typography>

        {/* Order Detail */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Order Detail</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              <strong>Status:</strong> {order.status}
            </Typography>
            <Typography>
              <strong>Contract:</strong> {order.contract_id.contract_code}
            </Typography>
            <Typography>
              <strong>Supplier:</strong> {order.contract_id.partner_id.name}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography>
              <strong>Items:</strong>
            </Typography>
            {order.details.map((d) => (
              <Typography key={d._id}>
                • {d.medicine_id.medicine_name} ({d.medicine_id.license_code}): {d.quantity}
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Inspection */}
        <Accordion disabled={inspectionsDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Inspection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}></Stack>
          </AccordionDetails>
        </Accordion>

        {/* Put Away */}
        <Accordion disabled={putAwayDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Put Away</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <IconButton onClick={fetchPutAway} size="small" sx={{ ml: 2 }} disabled={putAwayDone}>
                <RefreshIcon />
              </IconButton>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2 }}>
                <IconButton onClick={openSearchModal} size="small">
                  <SearchIcon />
                </IconButton>
                <Typography variant="body2">Find by package ID</Typography>
              </Stack>
              {loadingPutAway ? (
                <CircularProgress />
              ) : (
                <Stack spacing={2}>
                  {/* Unarranged packages */}
                  <Paper sx={{ flex: 1, p: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      To Put Away
                    </Typography>
                    {unarranged.length === 0 ? (
                      <Typography>No unarranged packages.</Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Batch</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {unarranged.map((pkg) => (
                            <TableRow key={pkg._id} sx={pkg._id === highlightedPkgId ? { backgroundColor: 'rgba(255,255,0,0.3)' } : {}}>
                              <TableCell>
                                {`${pkg.batch_id.batch_code} – ${pkg.batch_id.medicine_id.medicine_name} (${pkg.batch_id.medicine_id.license_code})`}
                              </TableCell>
                              <TableCell>{pkg.quantity}</TableCell>
                              <TableCell>
                                <IconButton size="small" color="error" onClick={() => openPutAwayModal(pkg)} disabled={putAwayDone}>
                                  <AddBoxIcon fontSize="small" />
                                </IconButton>

                                <IconButton size="small" color="info" onClick={() => handleShowRelated(pkg)}>
                                  <LocationOnIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handlePrintLabel(pkg)}
                                >
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Paper>

                  {/* Arranged packages */}
                  <Paper sx={{ flex: 1, p: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Arranged
                    </Typography>
                    {arranged.length === 0 ? (
                      <Typography>No arranged packages.</Typography>
                    ) : (
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Batch</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {arranged.map((pkg) => (
                            <TableRow key={pkg._id} sx={pkg._id === highlightedPkgId ? { backgroundColor: 'rgba(255,255,0,0.3)' } : {}}>
                              <TableCell>
                                {`${pkg.batch_id.batch_code} – ${pkg.batch_id.medicine_id.medicine_name} (${pkg.batch_id.medicine_id.license_code})`}
                              </TableCell>
                              <TableCell>{pkg.quantity}</TableCell>
                              <TableCell>
                                {pkg.location_id
                                  ? `${pkg.location_id.area_id?.name || '—'} • Bay ${pkg.location_id.bay}, Row ${pkg.location_id.row}, Level ${pkg.location_id.column}`
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handlePrintLabel(pkg)}
                                >
                                  <ReceiptIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Paper>
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Dialog open={putAwayModalOpen} onClose={closePutAwayModal}>
          <DialogTitle>Assign Put‑Away Location</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1, minWidth: 300 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  label="Location ID"
                  fullWidth
                  autoFocus
                  value={locForm.location_id}
                  onChange={(e) => setLocForm({ ...locForm, location_id: e.target.value })}
                  onKeyDown={onLocationKeyDown}
                  inputProps={{ maxLength: 24 }}
                />
                <Button onClick={handleLookupLocation} variant="outlined">
                  Auto‑fill
                </Button>
              </Stack>

              <FormControl fullWidth>
                <InputLabel>Area</InputLabel>
                <Select value={locForm.area_id || ''} label="Area" onChange={(e) => setLocForm({ ...locForm, area_id: e.target.value })}>
                  {Array.isArray(areas) &&
                    areas.map((a) => (
                      <MenuItem key={a._id} value={a._id}>
                        {a.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
              <TextField label="Bay" value={locForm.bay} onChange={(e) => setLocForm({ ...locForm, bay: e.target.value })} fullWidth />
              <TextField label="Row" value={locForm.row} onChange={(e) => setLocForm({ ...locForm, row: e.target.value })} fullWidth />
              <TextField
                label="Level"
                value={locForm.level}
                onChange={(e) => setLocForm({ ...locForm, level: e.target.value })}
                fullWidth
              />
              {locError && <Alert severity="error">{locError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closePutAwayModal}>Cancel</Button>
            <Button onClick={handleSubmitPutAway} variant="contained">
              Submit
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={relatedModalOpen} onClose={() => setRelatedModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Related Locations</DialogTitle>
          <DialogContent dividers>
            {relatedError && <Alert severity="error">{relatedError}</Alert>}

            <Typography variant="subtitle1" mt={1}>
              Same Batch Locations
            </Typography>
            {relatedBatchLocs.length === 0 ? (
              <Typography>No locations found for this batch.</Typography>
            ) : (
              relatedBatchLocs.map((loc) => (
                <Typography key={loc._id}>
                  • {loc.area_id.name} — Bay {loc.bay}, Row {loc.row}, Level {loc.column}
                </Typography>
              ))
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1">Same Medicine Locations</Typography>
            {relatedMedLocs.length === 0 ? (
              <Typography>No locations found for this medicine.</Typography>
            ) : (
              relatedMedLocs.map((loc) => (
                <Typography key={loc._id}>
                  • {loc.area_id.name} — Bay {loc.bay}, Row {loc.row}, Level {loc.column}
                </Typography>
              ))
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRelatedModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        {/* 3) The Search Modal */}
        <Dialog open={searchModalOpen} onClose={closeSearchModal}>
          <DialogTitle>Find Package</DialogTitle>
          <DialogContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
            >
              <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                <TextField
                  label="Package ID"
                  fullWidth
                  value={searchPackageId}
                  onChange={(e) => setSearchPackageId(e.target.value)}
                  autoFocus
                  inputProps={{ maxLength: 24 }}
                />
                <Button type="submit" variant="contained">
                  Search
                </Button>
              </Stack>
            </form>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ImportOrderDetail;
