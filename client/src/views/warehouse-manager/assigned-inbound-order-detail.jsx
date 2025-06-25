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
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
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

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        setLoading(true);
        const orderResp = await axios.get(`/api/import-orders/${orderId}`);
        if (!orderResp.data.success) throw new Error('Không lấy được chi tiết đơn hàng');
        setOrder(orderResp.data.data);

        const inspResp = await axios.get(`/api/warehouse_manager/import-orders/${orderId}/inspections`);
        const insps = inspResp.data.inspections || [];
        setInspections(insps);

        setPackages(insps.map(i => ({
          batch_id: i.batch_id?._id || '',
          quantity: i.actual_quantity - i.rejected_quantity
        })));
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

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
      .reduce((acc, p) => acc + Number(p.quantity || 0), 0);
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

  const handleContinue = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await Promise.all(packages.map(p =>
        axios.post('/api/warehouse_manager/packages', {
          import_order_id: orderId,
          batch_id: p.batch_id,
          quantity: p.quantity
        })
      ));
      router.push(`/assigned-inbound-order/${orderId}/put-away`);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tạo packages');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box textAlign="center" py={8}>
      <CircularProgress />
    </Box>
  );
  if (error) return (
    <Alert severity="error" sx={{ m: 4 }}>
      {error}
    </Alert>
  );
  if (!order) return (
    <Alert severity="info" sx={{ m: 4 }}>
      Không tìm thấy đơn hàng
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
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Inspection</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {inspections.length === 0 ? (
              <Typography>No inspection records.</Typography>
            ) : inspections.map(i => (
              <Box key={i._id} sx={{ mb: 1 }}>
                <Typography>
                  • {i.batch_id?.batch_code || '—'}: arrived {i.actual_quantity - i.rejected_quantity}, rejected {i.rejected_quantity}
                </Typography>
                {i.note && (
                  <Typography variant="body2" color="text.secondary">
                    Note: {i.note}
                  </Typography>
                )}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Packages */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Packages</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {packages.map((p, idx) => {
                const opt = batchOptions.find(o => o.id === p.batch_id) || {};
                return (
                  <Stack
                    key={idx}
                    direction="row"
                    spacing={2}
                    alignItems="center"
                  >
                    <FormControl sx={{ flex: 1 }}>
                      <InputLabel>Batch</InputLabel>
                      <Select
                        size="small"
                        value={p.batch_id}
                        label="Batch"
                        onChange={e => handlePkgChange(idx, 'batch_id', e.target.value)}
                      >
                        {batchOptions.map(opt => (
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
                      inputProps={{ min: 0, max: opt.max }}
                      value={p.quantity}
                      onChange={e => handlePkgChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 120 }}
                    />

                    <IconButton
                      size="small"
                      aria-label="remove"
                      onClick={() => removePackageRow(idx)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}

              <Button onClick={addPackageRow} size="small">
                + Add Package
              </Button>

              <Divider />

              <Button
                variant="contained"
                disabled={!isValid || saving}
                onClick={handleContinue}
              >
                {saving ? 'Saving…' : 'Continue to Put Away'}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Put Away (disabled) */}
        <Accordion disabled>
          <AccordionSummary>
            <Typography>Put Away</Typography>
          </AccordionSummary>
        </Accordion>
      </Container>
    </Box>
  );
}
