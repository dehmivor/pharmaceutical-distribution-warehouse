'use client';

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
  TableCell,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useTheme } from '@mui/material/styles';

export default function ImportOrderDetail() {
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

  // Initial fetch: order + inspections + initial packages
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        setLoading(true);
        const { data: orderResp } = await axios.get(`/api/import-orders/${orderId}`);
        if (!orderResp.success) throw new Error('Failed to load order');
        setOrder(orderResp.data);

        const { data: inspResp } = await axios.get(`/api/warehouse_manager/import-orders/${orderId}/inspections`);
        const insps = inspResp.inspections || [];
        setInspections(insps);

        setPackages(insps.map(i => ({
          batch_id: i.batch_id?._id || '',
          quantity: i.actual_quantity - i.rejected_quantity
        })))
        
        switch (orderResp.data.status){
          case 'delivered':
            enableAccordion('delivered');
            break;
          case 'checked':
            enableAccordion('checked');
            break;
          default:
            enableAccordion('other');
            break;
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
      const resp = await axios.get(`/api/packages/import-order/${orderId}`);
      // resp.data might be { success, data: [...] }
      const list = Array.isArray(resp.data.data)
        ? resp.data.data
        : [];
      setPutAway(list);
    } catch (err) {
      console.error(err);
      setPutAway([]);
    } finally {
      setLoadingPutAway(false);
    }
  };

  const handleClearLocation = async (pkgId) => {
    try {
      await axios.patch(`/api/packages/${pkgId}/clear-location`);
      await fetchPutAway();
    } catch (err) {
      console.error(err);
    }
  };


  const enableAccordion = async (orderState) => {
    if ( orderState == 'other ' ){
      setInspectionsDone(true);
      setPackagesDone(true);
      setPutAwayDone(true);
    }
    if ( orderState == 'delivered' ){
      setInspectionsDone(false);
      setPackagesDone(true);
      setPutAwayDone(true);
    }
    if ( orderState == 'checked' ){
      setInspectionsDone(true);
      setPackagesDone(false);
      setPutAwayDone(true);
    }
    if ( orderState == 'packaged' ){
      setInspectionsDone(true);
      setPackagesDone(true);
      setPutAwayDone(false);
    }
  } 

  const batchOptions = inspections.map(i => {
    const net = i.actual_quantity - i.rejected_quantity;
    return {
      id: i.batch_id?._id || '',
      label: i.batch_id?.batch_code || '—',
      max: net,
    };
  });

  const isValid = inspections.every(ins => {
    const net = ins.actual_quantity - ins.rejected_quantity;
    const sum = packages
      .filter(p => p.batch_id === ins.batch_id?._id)
      .reduce((a, p) => a + Number(p.quantity || 0), 0);
    return sum === net;
  });


  const handlePkgChange = (idx, field, value) => {
    setPackages(pkgs => {
      const next = [...pkgs];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addPackageRow = () => {
    setPackages(pkgs => [
      ...pkgs,
      { batch_id: batchOptions[0]?.id || '', quantity: 0 }
    ]);
  };

  const removePackageRow = idx => {
    setPackages(pkgs => pkgs.filter((_, i) => i !== idx));
  };

  const handleContinuePackages = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await Promise.all(packages.map(p =>
        axios.post('/api/packages', {
          import_order_id: orderId,
          batch_id: p.batch_id,
          quantity: p.quantity
        })
      ));
      await fetchPutAway();
      enableAccordion('packaged');    // ← disable creation UI
    } catch (err) {
      console.error(err);
      setError('Error creating packages');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = () => {
    // navigate to next step, or call API to mark order arranged
    router.push(`/assigned-inbound-order/${orderId}/summary`);
  };

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!order) return <Alert severity="info" sx={{ m: 4 }}>Order not found</Alert>;

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
            <Typography><strong>Status:</strong> {order.status}</Typography>
            <Typography>
              <strong>Contract:</strong> {order.supplier_contract_id.contract_code}
            </Typography>
            <Typography>
              <strong>Supplier:</strong> {order.supplier_contract_id.supplier_id.name}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography><strong>Items:</strong></Typography>
            {order.details.map(d => (
              <Typography key={d._id}>
                • {d.medicine_id.medicine_name}: {d.quantity} @ {d.unit_price}
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
            {inspections.map(i => (
              <Typography key={i._id}>
                {i.batch_id?.batch_code}: arrived {i.actual_quantity - i.rejected_quantity}, rejected {i.rejected_quantity}
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Packages Creation */}
        <Accordion disabled={packagesDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Packages</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {packages.map((p, idx) => {
                const opt = batchOptions.find(o => o.id === p.batch_id) || {};
                return (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ flex: 1 }} disabled={packagesDone}>
                      <InputLabel>Batch</InputLabel>
                      <Select
                        size="small"
                        value={p.batch_id}
                        onChange={e => handlePkgChange(idx, 'batch_id', e.target.value)}
                      >
                        {batchOptions.map(opt => (
                          <MenuItem key={opt.id} value={opt.id}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="Quantity"
                      type="number"
                      value={p.quantity}
                      onChange={e => handlePkgChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 120 }}
                      disabled={packagesDone}
                    />
                    <IconButton
                      size="small"
                      onClick={() => removePackageRow(idx)}
                      disabled={packagesDone}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}

              <Button onClick={addPackageRow} size="small" disabled={packagesDone}>
                + Add Package
              </Button>

              <Divider />

              <Button
                variant="contained"
                disabled={!isValid || saving || packagesDone}
                onClick={handleContinuePackages}
              >
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
              <IconButton onClick={fetchPutAway} size="small" sx={{ ml: 2 }}>
                <RefreshIcon />
              </IconButton>
              {loadingPutAway ? (
                <CircularProgress />
              ) : putAway.length === 0 ? (
                <Typography>No packages yet.</Typography>
              ) : (
                <Paper>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Batch</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {putAway.map(pkg => (
                        <TableRow key={pkg._id}>
                          <TableCell>{pkg.batch_id.batch_code}</TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>
                            {pkg.location_id ? 'Arranged' : 'Unarranged'}
                          </TableCell>
                          <TableCell>
                            {pkg.location_id && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleClearLocation(pkg._id)}
                              >
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}

              <Button
                variant="contained"
                disabled={!putAway.length || !putAway.every(p => p.location_id)}
                onClick={handleFinalize}
              >
                Finalize
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
}
