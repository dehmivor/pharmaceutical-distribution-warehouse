'use client';

import bwipjs from 'bwip-js/browser';
import PrintIcon from '@mui/icons-material/Print';
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
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useTheme } from '@mui/material/styles';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ImportOrderDetail() {
  const theme = useTheme();
  const { orderId } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [packages, setPackages] = useState([]);
  const [saving, setSaving] = useState(false);

  const [inspectionsDone, setInspectionsDone] = useState(false);
  const [packagesDone, setPackagesDone] = useState(false);
  const [putAwayDone, setPutAwayDone] = useState(false);

  const [putAway, setPutAway] = useState([]);
  const [loadingPutAway, setLoadingPutAway] = useState(false);

  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [newMedicineId, setNewMedicineId] = useState('');
  const [newProdDate, setNewProdDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [newBatchCode, setNewBatchCode] = useState('');

  const [newBatches, setNewBatches] = useState([]);

  // Initial fetch: order + inspections + initial packages
  useEffect(() => {
    if (!orderId) return;

    (async () => {
      try {
        setLoading(true);

        // 1) Load the order
        const { data: orderResp } = await axios.get(`/api/import-orders/${orderId}`, {
          headers: getAuthHeaders()
        });
        if (!orderResp.success) throw new Error('Failed to load order');
        setOrder(orderResp.data);

        // 2) Load the inspections for this order
        const { data: inspResp } = await axios.get(`/api/import-inspections/import-orders/${orderId}/inspections`, {
          headers: getAuthHeaders()
        });
        const insps = inspResp.inspections || [];
        setInspections(insps);

        // 3) Prefill packages with NET quantities (actual - rejected)
        const prefillPackages = insps.map((i) => ({
          batch_id: i.batch_id?._id || '',
          quantity: i.actual_quantity - i.rejected_quantity
        }));

        setPackages(prefillPackages);

        // 4) Fetch any existing “put away” packages
        await fetchPutAway();

        // 5) Enable/disable accordions based on status
        switch (orderResp.data.status) {
          case 'delivered':
            enableAccordion('delivered');
            break;
          case 'checked':
            enableAccordion('checked');
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

  const fetchPutAway = async () => {
    try {
      setLoadingPutAway(true);
      const resp = await axios.get(`/api/packages/import-order/${orderId}`, {
        headers: getAuthHeaders()
      });
      // resp.data might be { success, data: [...] }
      const list = Array.isArray(resp.data.data) ? resp.data.data : [];
      setPutAway(list);
    } catch (err) {
      console.error(err);
      setPutAway([]);
    } finally {
      setLoadingPutAway(false);
    }
  };

  const fetchInspection = async () => {
    try {
      const { data: inspResp } = await axios.get(`/api/import-inspections/import-orders/${orderId}/inspections`, {
        headers: getAuthHeaders()
      });
      const insps = inspResp.inspections || [];
      setInspections(insps);
    } catch (err) {
      console.error(err);
      setPutAway([]);
    }
  };

  const handleClearLocation = async (pkgId) => {
    try {
      await axios.patch(`/api/packages/${pkgId}/clear-location`, {
        headers: getAuthHeaders()
      });
      await fetchPutAway();
    } catch (err) {
      console.error(err);
    }
  };

  const enableAccordion = async (orderState) => {
    if (orderState == 'other') {
      setInspectionsDone(true);
      setPackagesDone(true);
      setPutAwayDone(true);
    }
    if (orderState == 'delivered') {
      setInspectionsDone(false);
      setPackagesDone(true);
      setPutAwayDone(true);
    }
    if (orderState == 'checked') {
      setInspectionsDone(true);
      setPackagesDone(false);
      setPutAwayDone(true);
    }
    if (orderState == 'packaged') {
      setInspectionsDone(true);
      setPackagesDone(true);
      setPutAwayDone(false);
    }
  };

  const [batchOptions, setBatchOptions] = useState([]);
  useEffect(() => {
    const opts = inspections
      // only keep inspections with a real batch_id
      .filter((i) => i.batch_id && i.batch_id._id)
      .map((i) => {
        const net = i.actual_quantity - i.rejected_quantity;
        return {
          id: i.batch_id._id,
          label: i.batch_id.batch_code,
          max: net
        };
      });

    setBatchOptions(opts);
  }, [inspections]);

  const openBatchDialog = () => {
    setNewMedicineId(inspections[0]?.batch_id?._id || '');
    setNewProdDate('');
    setNewExpiryDate('');
    setBatchError(null);
    setBatchDialogOpen(true);
    setNewBatchCode('');
  };
  const closeBatchDialog = () => setBatchDialogOpen(false);

  // Create new batch
  const handleCreateBatch = () => {
    if (!newMedicineId || !newBatchCode || !newProdDate || !newExpiryDate) {
      setBatchError('All fields are required');
      return;
    }
    // stash locally
    setNewBatches((list) => [
      ...list,
      {
        medicine_id: newMedicineId,
        batch_code: newBatchCode,
        production_date: newProdDate,
        expiry_date: newExpiryDate
      }
    ]);
    // add a temp option so users can pick it immediately
    setBatchOptions((opts) => [...opts, { id: newBatchCode, label: newBatchCode, max: 0 }]);
    closeBatchDialog();
  };

  const uniqueInspections = inspections
    .filter((i) => i.medicine_id && i.medicine_id._id)
    .filter((i, idx, arr) => arr.findIndex((j) => j.medicine_id._id === i.medicine_id._id) === idx);

  const isValid =
    // 1) Must have at least one package row
    packages.length > 0 &&
    // 2) Every row must have selected a batch
    packages.every((p) => Boolean(p.batch_id)) &&
    // 3) Package sums must exactly match each inspection’s net quantity
    inspections.every((ins) => {
      // If inspection has no batch_id, skip it
      if (!ins.batch_id?._id) return true;

      const net = ins.actual_quantity - ins.rejected_quantity;
      const sum = packages
        .filter((p) => String(p.batch_id) === String(ins.batch_id._id))
        .reduce((total, p) => total + Number(p.quantity || 0), 0);

      return sum === net;
    });

  const handlePkgChange = (idx, field, value) => {
    setPackages((pkgs) => {
      const next = [...pkgs];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addPackageRow = () => {
    setPackages((pkgs) => [...pkgs, { batch_id: batchOptions[0]?.id || '', quantity: 0 }]);
  };

  const removePackageRow = (idx) => {
    setPackages((pkgs) => pkgs.filter((_, i) => i !== idx));
  };

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const token = localStorage.getItem('auth-token');
      await axios.delete(`/api/inspections/${inspectionId}`, {
        headers: getAuthHeaders()
      });

      // Remove it directly from the inspections array
      setInspections((prev) => prev.filter((insp) => insp._id !== inspectionId));

      setSnackbar({
        open: true,
        message: 'Đã xóa phiếu kiểm nhập thành công!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Lỗi xóa phiếu kiểm nhập!',
        severity: 'error'
      });
    }
  };

  const handlePrintLabel = async (pkg) => {
    try {
      // 1) Gather data
      const pkgId = pkg._id;
      const medicineName = pkg.batch_id.medicine_id.medicine_name;
      const batchId = pkg.batch_id._id;
      const expDate = pkg.batch_id.expiry_date.slice(0, 10); // YYYY-MM-DD
      const orderIdStr = order._id;
      const supplierName = order.supplier_contract_id.supplier_id.name;

      // 2) Render barcode to offscreen canvas
      const canvas = document.createElement('canvas');
      await bwipjs.toCanvas(canvas, {
        bcid: 'code128',
        text: pkgId,
        scale: 3,
        includetext: true,
        textxalign: 'center',
        textsize: 10
      });
      const barcodeDataUrl = canvas.toDataURL('image/png');

      // 3) Create hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      // 4) Write label HTML into it
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
          <div class="field"><span class="label">Medicine:</span> ${medicineName}</div>
          <div class="field"><span class="label">Batch ID:</span> ${batchId}</div>
          <div class="field"><span class="label">EXP:</span> ${expDate}</div>
          <div class="field"><span class="label">Import Order:</span> ${orderIdStr}</div>
          <div class="field"><span class="label">Supplier:</span> ${supplierName}</div>
        </body>
      </html>
    `);
      doc.close();

      // 5) When ready, trigger print and clean up
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

  const handleArrival = async () => {
    try {
      console.log('auth headers:', getAuthHeaders());
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'delivered' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'delivered' }));
      enableAccordion('delivered');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Lỗi khi cập nhật trạng thái đơn');
    }
  };

  const handleFinishInspection = async () => {
    try {
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'checked' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'checked' }));
      enableAccordion('checked');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Lỗi khi cập nhật trạng thái đơn');
    }
  };

  const handleContinuePackages = async () => {
    if (!isValid) return;
    setSaving(true);

    try {
      // 1) Create any new batches
      const createdMap = {};
      for (let spec of newBatches) {
        const resp = await axios.post(
          '/api/batch',
          {
            medicine_id: spec.medicine_id,
            batch_code: spec.batch_code,
            production_date: spec.production_date,
            expiry_date: spec.expiry_date,
            supplier_id: order.supplier_contract_id.supplier_id._id
          },
          {
            headers: getAuthHeaders()
          }
        );
        const b = resp.data.data;
        createdMap[spec.batch_code] = {
          id: b._id,
          label: b.batch_code,
          max: 0
        };
      }

      // 2) Build the **updated** packages array locally
      const updatedPackages = packages.map((p) => {
        const real = createdMap[p.batch_id];
        return {
          batch_id: real ? real.id : p.batch_id,
          quantity: p.quantity
        };
      });

      // 3) Commit to state
      setBatchOptions((opts) => opts.map((o) => createdMap[o.id] || o));
      setPackages(updatedPackages);
      setNewBatches([]);

      // 4) Now post using the **updatedPackages** variable
      await Promise.all(
        updatedPackages.map((p) =>
          axios.post(
            '/api/packages',
            {
              import_order_id: orderId,
              batch_id: p.batch_id,
              quantity: p.quantity
            },
            {
              headers: getAuthHeaders()
            }
          )
        )
      );

      // 5) Advance order status
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'arranged' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'arranged' }));
      enableAccordion('packaged');

      // 6) Refresh the list
      await fetchPutAway();
    } catch (err) {
      console.error(err);
      setError('Error creating batches/packages');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'completed' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'completed' }));
      enableAccordion('other');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Lỗi khi cập nhật trạng thái đơn');
    }
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
        <Typography variant="h5" gutterBottom>
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
              <strong>Contract:</strong> {order.supplier_contract_id.contract_code}
            </Typography>
            <Typography>
              <strong>Supplier:</strong> {order.supplier_contract_id.supplier_id.name}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography>
              <strong>Items:</strong>
            </Typography>
            {order.details.map((d) => (
              <Typography key={d._id}>
                • {d.medicine_id.medicine_name}: {d.quantity} @ {d.unit_price}
              </Typography>
            ))}
            <Divider sx={{ my: 2 }} />
            <Button variant="contained" disabled={order.status != 'approved'} onClick={handleArrival}>
              Arrived
            </Button>
          </AccordionDetails>
        </Accordion>

        {/* Inspection */}
        <Accordion disabled={inspectionsDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Inspection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <IconButton onClick={fetchInspection} size="small" sx={{ ml: 2 }} disabled={inspectionsDone}>
                <RefreshIcon />
              </IconButton>
              <TableContainer component={Paper} elevation={3}>
                <Table size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medicine</TableCell>
                      <TableCell>Thực nhập</TableCell>
                      <TableCell>Số loại bỏ</TableCell>
                      <TableCell>Hành động</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inspections.map((insp) => (
                      <TableRow key={insp._id} hover>
                        <TableCell>
                          <Tooltip title={insp._id}>
                            <Typography variant="body2" fontWeight="bold">
                              {insp.medicine_id?.medicine_name || ''}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{insp.actual_quantity}</TableCell>
                        <TableCell>{insp.rejected_quantity}</TableCell>
                        <TableCell>
                          <Tooltip title="Xóa phiếu kiểm nhập">
                            <span>
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => handleDeleteInspection(insp._id)}
                                disabled={inspectionsDone}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button variant="contained" disabled={inspectionsDone} onClick={handleFinishInspection}>
                Finish inspection
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Packages Creation */}
        <Accordion disabled={packagesDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Packages</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <IconButton size="small" color="primary" onClick={openBatchDialog} disabled={packagesDone} sx={{ ml: 2 }}>
                <AddCircleIcon />
              </IconButton>
              {packages.map((p, idx) => {
                const opt = batchOptions.find((o) => o.id === p.batch_id) || {};
                return (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ flex: 1 }} disabled={packagesDone}>
                      <InputLabel>Batch</InputLabel>
                      <Select size="small" value={p.batch_id} onChange={(e) => handlePkgChange(idx, 'batch_id', e.target.value)}>
                        {batchOptions.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="Quantity"
                      type="number"
                      value={p.quantity}
                      onChange={(e) => handlePkgChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 120 }}
                      disabled={packagesDone}
                    />
                    <IconButton size="small" onClick={() => removePackageRow(idx)} disabled={packagesDone}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}

              <Button onClick={addPackageRow} size="small" disabled={packagesDone}>
                + Add Package
              </Button>

              <Divider />

              <Button variant="contained" disabled={!isValid || saving || packagesDone} onClick={handleContinuePackages}>
                {saving ? 'Saving…' : 'Continue to Put Away'}
              </Button>
            </Stack>
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
              {loadingPutAway ? (
                <CircularProgress />
              ) : putAway.length === 0 ? (
                <Typography>No packages yet.</Typography>
              ) : (
                <Paper>
                  <Table size="small" disabled={putAwayDone}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Batch</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {putAway.map((pkg) => (
                        <TableRow key={pkg._id}>
                          <TableCell>{pkg.batch_id.batch_code}</TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>{pkg.location_id ? 'Arranged' : 'Unarranged'}</TableCell>
                          <TableCell>
                            {pkg.location_id && (
                              <IconButton size="small" color="error" onClick={() => handleClearLocation(pkg._id)} disabled={putAwayDone}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" color="primary" onClick={() => handlePrintLabel(pkg)} disabled={putAwayDone}>
                              <PrintIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}

              <Button
                variant="contained"
                disabled={!putAway.length || !putAway.every((p) => p.location_id) || putAwayDone}
                onClick={handleFinalize}
              >
                Finalize
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
        {/* Batch Creation Dialog */}
        <Dialog open={batchDialogOpen} onClose={closeBatchDialog}>
          <DialogTitle>Create New Batch</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
              <TextField label="Batch Code" value={newBatchCode} onChange={(e) => setNewBatchCode(e.target.value)} required />
              <FormControl fullWidth>
                <InputLabel>Medicine</InputLabel>
                <Select value={newMedicineId} label="Medicine" onChange={(e) => setNewMedicineId(e.target.value)}>
                  {uniqueInspections.map((i) => (
                    <MenuItem key={i._id} value={i.medicine_id?._id}>
                      {i.medicine_id?.medicine_name || '—'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Production Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={newProdDate}
                onChange={(e) => {
                  const prod = e.target.value;
                  setNewProdDate(prod);

                  // If the current expiry is before the new production, bump it forward
                  if (newExpiryDate && newExpiryDate < prod) {
                    setNewExpiryDate(prod);
                  }
                }}
              />

              <TextField
                label="Expiry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                  min: newProdDate || undefined // disable dates before production
                }}
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
              {batchError && <Alert severity="error">{batchError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeBatchDialog} disabled={creatingBatch}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateBatch} disabled={creatingBatch}>
              {creatingBatch ? 'Creating…' : 'Create Batch'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ImportOrderDetail;
