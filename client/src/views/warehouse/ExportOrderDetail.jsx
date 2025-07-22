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
  Paper,
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


function ExportOrderDetail() {
  const theme = useTheme();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pickingDone, setPickingDone] = useState(false);

  const [loadingPicking, setLoadingPicking] = useState(false);


  const fetchPicking = async () => {
      try {
        setLoadingPutAway(true);
        const resp = await axios.get(`/api/packages/import-order/${orderId}`, {
          headers: getAuthHeaders()
        });
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


  // Initial fetch
  useEffect(() => {
    if (!orderId) return;

    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(`/api/export-orders/${orderId}`, {
          headers: getAuthHeaders()
        });
        if (!resp.data.success) {
          throw new Error('Failed to load export order');
        }
        setOrder(resp.data.data);
        
        //Enable/disable accordions based on status
        switch (resp.data.status) {
          case 'approved':
            enableAccordion('approved');
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
      setPickingDone(false);
    }
    if (orderState == 'approved') {
      setPickingDone(true);
    }
  }

  if (loading) return <Box textAlign="center" py={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 4 }}>{error}</Alert>;
  if (!order) return <Alert severity="info" sx={{ m: 4 }}>Order not found</Alert>;

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="md">
        <Typography variant="h5" gutterBottom>
          Export Order #{order._id}
        </Typography>

        {/* Order Detail */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Order Detail</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <AccordionDetails>
            <Typography><strong>Status:</strong> {order.status}</Typography>
            <Typography><strong>Contract Code:</strong> {order.contract_id.contract_code}</Typography>
            <Typography><strong>Created By:</strong> {order.created_by.email}</Typography>
            <Typography><strong>Warehouse Manager:</strong> {order.warehouse_manager_id?.email || 'N/A'}</Typography>
          </AccordionDetails>
            <Divider sx={{ my: 2 }} />
            <Typography><strong>Items:</strong></Typography>
            {order.details.map(d => (
              <Typography key={d._id}>
                • {d.medicine_id.medicine_name} ({d.medicine_id.license_code}): {d.expected_quantity}
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>

        {/* Picking */}
        <Accordion disabled={pickingDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Picking</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <IconButton onClick={fetchPicking} size="small" sx={{ ml: 2 }} disabled={pickingDone}>
                <RefreshIcon />
              </IconButton>
              {loadingPicking ? (
                <CircularProgress />
              ) : (
                <Stack spacing={2}>
                </Stack>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
};

export default ExportOrderDetail
