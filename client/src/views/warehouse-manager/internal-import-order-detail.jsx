'use client';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  TextField,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  AddCircle as AddCircleIcon,
  DeleteForever as DeleteForeverIcon,
  Receipt as ReceiptIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import bwipjs from 'bwip-js/browser';
import useTrans from '@/hooks/useTrans';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getStatusColor = (status) => {
  const statusColors = {
    draft: 'default',
    approved: 'primary',
    delivered: 'info',
    checked: 'warning',
    arranged: 'secondary',
    completed: 'success',
    cancelled: 'error',
    rejected: 'error'
  };
  return statusColors[status] || 'default';
};

const getStatusLabel = (status) => {
  const statusLabels = {
    draft: 'Draft',
    approved: 'Approved',
    delivered: 'Delivered',
    checked: 'Checked',
    arranged: 'Arranged',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected'
  };
  return statusLabels[status] || status;
};

const InternalImportOrderDetail = ({ orderId }) => {
  const router = useRouter();
  const trans = useTrans();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Batch creation states
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newProdDate, setNewProdDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newMedicineId, setNewMedicineId] = useState('');
  const [newBatches, setNewBatches] = useState([]);

  // Inspection states
  const [inspections, setInspections] = useState([]);
  const [confirmFinishInspection, setConfirmFinishInspection] = useState(false);

  // Packages and Put Away states
  const [packages, setPackages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [putAway, setPutAway] = useState([]);
  const [loadingPutAway, setLoadingPutAway] = useState(false);
  const [batchOptions, setBatchOptions] = useState([]);
  const [validBatchOptions, setValidBatchOptions] = useState([]);

  // User data
  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userId = userData.userId;

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Check if token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      const response = await axios.get(`${backendUrl}/api/import-orders/${orderId}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(error.response?.data?.error || 'Failed to fetch order details');
      }
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const updateOrderStatus = async () => {
    try {
      setUpdatingStatus(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Check if token exists
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      if (!token) {
        setSnackbar({
          open: true,
          message: trans.internalImportOrderDetail.authenticationRequired,
          severity: 'error'
        });
        return;
      }

      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${orderId}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setOrder(response.data.data);

        // If status changed to "checked", automatically create batches
        if (newStatus === 'checked') {
          setSnackbar({
            open: true,
            message: trans.internalImportOrderDetail.orderStatusUpdatedToChecked,
            severity: 'info'
          });
        } else {
          setSnackbar({
            open: true,
            message: trans.internalImportOrderDetail.orderStatusUpdatedSuccessfully,
            severity: 'success'
          });
        }
        setStatusDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.response?.status === 401) {
        setSnackbar({
          open: true,
          message: trans.internalImportOrderDetail.authenticationFailed,
          severity: 'error'
        });
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || trans.internalImportOrderDetail.failedToUpdateOrderStatus,
          severity: 'error'
        });
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Create inspection data from order details for internal orders
  useEffect(() => {
    if (order && order.details) {
      const inspectionData = order.details.map((detail) => ({
        _id: `temp_${detail.medicine_id._id}`,
        medicine_id: detail.medicine_id,
        actual_quantity: detail.quantity, // For internal orders, actual = order quantity
        rejected_quantity: 0, // No rejection for internal orders
        status: 'completed'
      }));
      setInspections(inspectionData);
    }
  }, [order]);

  // Prefill packages from inspections
  useEffect(() => {
    if (inspections.length) {
      const pre = inspections.map((i) => ({
        batch_id: i.batch_id?._id || '',
        quantity: i.actual_quantity - i.rejected_quantity
      }));
      setPackages(pre);
    }
  }, [inspections]);

  // Fetch valid batches for medicines
  useEffect(() => {
    const meds = Array.from(new Set(inspections.map((i) => i.medicine_id?._id).filter(Boolean)));
    if (meds.length === 0) {
      setValidBatchOptions([]);
      return;
    }

    (async () => {
      try {
        const results = await Promise.all(meds.map((mid) => axios.get(`/api/batch/valid/${mid}`, { headers: getAuthHeaders() })));
        const serverOpts = results.flatMap((r) =>
          (r.data.data || []).map((b) => ({
            id: b._id,
            label: `${b.batch_code} - ${b.medicine_id.medicine_name} (${b.medicine_id.license_code})`,
            max: b.quantity
          }))
        );
        setValidBatchOptions(serverOpts);
      } catch (err) {
        console.error('Failed to load valid batches:', err);
        setValidBatchOptions([]);
      }
    })();
  }, [inspections, newBatches]);

  // Build batch options from inspections
  useEffect(() => {
    const opts = inspections
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

  const handleBack = () => {
    router.back();
  };

  const handleStatusChange = () => {
    setNewStatus(order.status);
    setStatusDialogOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Inspection functions
  const fetchInspection = async () => {
    // For internal orders, inspection data is derived from order details
    if (order && order.details) {
      const inspectionData = order.details.map((detail) => ({
        _id: `temp_${detail.medicine_id._id}`,
        medicine_id: detail.medicine_id,
        actual_quantity: detail.quantity,
        rejected_quantity: 0,
        status: 'completed'
      }));
      setInspections(inspectionData);
    }
  };

  const handleDeleteInspection = async (inspectionId) => {
    // For internal orders, we don't actually delete inspections
    // Just remove from local state for UI purposes
    setInspections((prev) => prev.filter((insp) => insp._id !== inspectionId));
  };

  const onFinishClickInspection = async () => {
    if (!confirmFinishInspection) {
      // First click: refresh inspection data and enter confirm mode
      await fetchInspection();
      setConfirmFinishInspection(true);
    } else {
      // Second click: actually finish inspection
      handleFinishInspection();
    }
  };

  const handleFinishInspection = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Update order status to checked
      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${orderId}/status`,
        { status: 'checked' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setOrder(response.data.data);
        setSnackbar({
          open: true,
          message: trans.internalImportOrderDetail.inspectionCompletedSuccessfully,
          severity: 'success'
        });
        setConfirmFinishInspection(false);
      }
    } catch (error) {
      console.error('Error completing inspection:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || trans.internalImportOrderDetail.failedToCompleteInspection,
        severity: 'error'
      });
    }
  };

  // Package management functions
  const addPackageRow = () => {
    setPackages((pkgs) => [...pkgs, { batch_id: batchOptions[0]?.id || '', quantity: 0 }]);
  };

  const removePackageRow = (idx) => {
    setPackages((pkgs) => pkgs.filter((_, i) => i !== idx));
  };

  const handlePkgChange = (idx, field, value) => {
    setPackages((pkgs) => {
      const next = [...pkgs];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Put Away functions
  const fetchPutAway = async () => {
    try {
      setLoadingPutAway(true);
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const resp = await axios.get(`${backendUrl}/api/packages/import-order/${orderId}`, {
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

  const handleClearLocation = async (pkgId) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.patch(
        `${backendUrl}/api/packages/${pkgId}/clear-location`,
        {
          ware_house_id: userId,
          import_order_id: orderId
        },
        { headers: getAuthHeaders() }
      );
      await fetchPutAway();
    } catch (err) {
      console.error(err);
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
      const supplierName = 'Internal Order'; // For internal orders

      // Fetch medicine details
      const med = pkg.batch_id?.medicine_id;
      const medicineLabel = med ? `${med.medicine_name} (${med.license_code})` : 'Unknown Medicine';

      // Render barcode to offscreen canvas
      const canvas = document.createElement('canvas');
      await bwipjs.toCanvas(canvas, {
        bcid: 'qrcode',
        text: pkgId,
        scale: 6,
        version: 5,
        eclevel: 'M',
        includeMargin: true
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
          <div class="field"><span class="label">Type:</span> ${supplierName}</div>
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
      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.cannotCreateBarcodeLabel,
        severity: 'error'
      });
    }
  };

  // Continue to packages
  const handleContinuePackages = async () => {
    if (!isValid) return;
    setSaving(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // 1) Create any new batches
      const createdMap = {};
      for (let spec of newBatches) {
        const resp = await axios.post(
          `${backendUrl}/api/batch`,
          {
            medicine_id: spec.medicine_id,
            batch_code: spec.batch_code,
            production_date: spec.production_date,
            expiry_date: spec.expiry_date,
            supplier_id: null // Internal order has no supplier
          },
          { headers: getAuthHeaders() }
        );
        const b = resp.data.data;
        createdMap[spec.batch_code] = {
          id: b._id,
          label: b.batch_code,
          max: 0
        };
      }

      // 2) Build the updated packages array locally
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

      // 4) Create packages
      await Promise.all(
        updatedPackages.map((p) =>
          axios.post(
            `${backendUrl}/api/packages`,
            {
              import_order_id: orderId,
              batch_id: p.batch_id,
              quantity: p.quantity
            },
            { headers: getAuthHeaders() }
          )
        )
      );

      // 5) Advance order status
      await axios.patch(`${backendUrl}/api/import-orders/${orderId}/status`, { status: 'arranged' }, { headers: getAuthHeaders() });
      setOrder((prev) => ({ ...prev, status: 'arranged' }));

      // 6) Refresh the list
      await fetchPutAway();

      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.packagesCreatedSuccessfully,
        severity: 'success'
      });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.errorCreatingBatchesPackages,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Finalize order
  const handleFinalize = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${orderId}/status`,
        { status: 'completed' },
        { headers: getAuthHeaders() }
      );

      if (response.status >= 200 && response.status < 300) {
        const orderData = response.data.data;
        setOrder((prev) => ({ ...prev, status: 'completed' }));

        setSnackbar({
          open: true,
          message: trans.internalImportOrderDetail.orderFinalizedSuccessfully,
          severity: 'success'
        });
      }
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái đơn:', err);
      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.errorUpdatingOrderStatus,
        severity: 'error'
      });
    }
  };

  // Validation functions
  const uniqueInspections = inspections
    .filter((i) => i.medicine_id && i.medicine_id._id)
    .filter((i, idx, arr) => arr.findIndex((j) => j.medicine_id._id === i.medicine_id._id) === idx);

  const allBatchOptions = [
    ...validBatchOptions,
    ...newBatches.map((nb) => ({
      id: nb.batch_code,
      label: `(new) ${nb.batch_code} – ${nb.medicine_name} (${nb.license_code})`,
      max: 0
    }))
  ].reduce((acc, opt) => {
    if (!acc.find((o) => o.id === opt.id)) acc.push(opt);
    return acc;
  }, []);

  // Build map: medicineId → net inspected quantity
  const netByMedicine = inspections.reduce((acc, ins) => {
    const medId = ins.medicine_id?.license_code;
    if (!medId) return acc;
    const net = ins.actual_quantity - ins.rejected_quantity;
    acc[medId] = (acc[medId] || 0) + net;
    return acc;
  }, {});

  function getLicenseCodeById(id, array) {
    const item = array.find((el) => el.id === id);
    if (!item) return null;

    const match = item.label.match(/\(([^)]+)\)$/); // extract text inside the last parentheses
    return match ? match[1] : null;
  }

  // Build map: medicineId → total packaged quantity
  const packedByMedicine = packages.reduce((acc, pkg) => {
    const medId = getLicenseCodeById(pkg.batch_id, allBatchOptions);
    if (!medId) return acc;
    acc[medId] = (acc[medId] || 0) + Number(pkg.quantity || 0);
    return acc;
  }, {});

  // Validation: non‑empty, every row has a batch, and the two maps match exactly
  const isValid =
    // must have at least one package row
    packages.length > 0 &&
    //every row quantity != 0
    packages.every((p) => p.quantity != 0) &&
    // every row has a selected batch
    packages.every((p) => Boolean(p.batch_id)) &&
    // every row has a quantity
    packages.every((p) => Boolean(p.quantity)) &&
    // same number of distinct medicines
    Object.keys(netByMedicine).length === Object.keys(packedByMedicine).length &&
    // every medicine's net inspected qty equals packaged qty
    Object.entries(netByMedicine).every(([medId, net]) => packedByMedicine[medId] === net);

  // Batch creation functions
  const openBatchDialog = () => {
    setNewMedicineId(order?.details?.[0]?.medicine_id?._id || '');
    setNewBatchCode('');
    setNewProdDate('');
    setNewExpiryDate('');
    setBatchError(null);
    setBatchDialogOpen(true);
  };

  const closeBatchDialog = () => setBatchDialogOpen(false);

  const handleCreateBatch = () => {
    if (!newMedicineId || !newBatchCode || !newProdDate || !newExpiryDate) {
      setBatchError('All fields are required');
      return;
    }

    if (new Date(newExpiryDate) <= new Date(newProdDate)) {
      setBatchError('Expiry date must be after production date');
      return;
    }

    const medicine = order?.details?.find((d) => d.medicine_id._id === newMedicineId)?.medicine_id;

    setNewBatches((list) => [
      ...list,
      {
        medicine_id: newMedicineId,
        batch_code: newBatchCode,
        production_date: newProdDate,
        expiry_date: newExpiryDate,
        medicine_name: medicine?.medicine_name || '',
        license_code: medicine?.license_code || ''
      }
    ]);

    closeBatchDialog();
  };

  const createBatchesForInternalOrder = async () => {
    if (newBatches.length === 0) {
      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.noBatchesToCreate,
        severity: 'warning'
      });
      return;
    }

    setCreatingBatch(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      // Create batches
      const batchPromises = newBatches.map((batch) =>
        axios.post(
          `${backendUrl}/api/batch`,
          {
            medicine_id: batch.medicine_id,
            batch_code: batch.batch_code,
            production_date: batch.production_date,
            expiry_date: batch.expiry_date,
            supplier_id: null // Internal order has no supplier
          },
          {
            headers: getAuthHeaders()
          }
        )
      );

      const batchResponses = await Promise.all(batchPromises);
      const createdBatches = batchResponses.map((res) => res.data.data);

      // Create packages for each batch
      const packagePromises = createdBatches.map((batch, index) => {
        const orderDetail = order.details.find((d) => d.medicine_id._id === batch.medicine_id);
        return axios.post(
          `${backendUrl}/api/packages`,
          {
            import_order_id: orderId,
            batch_id: batch._id,
            quantity: orderDetail?.quantity || 0
          },
          {
            headers: getAuthHeaders()
          }
        );
      });

      await Promise.all(packagePromises);

      setSnackbar({
        open: true,
        message: trans.internalImportOrderDetail.batchesAndPackagesCreatedSuccessfully,
        severity: 'success'
      });

      setNewBatches([]);
      fetchOrder(); // Refresh order data
    } catch (error) {
      console.error('Error creating batches:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || trans.internalImportOrderDetail.failedToCreateBatches,
        severity: 'error'
      });
    } finally {
      setCreatingBatch(false);
    }
  };

  const handleArrival = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.patch(
        `${backendUrl}/api/import-orders/${orderId}/status`,
        { status: 'delivered' },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setOrder((prev) => ({ ...prev, status: 'delivered' }));
        setSnackbar({
          open: true,
          message: trans.internalImportOrderDetail.orderStatusUpdatedToDelivered,
          severity: 'success'
        });
        await fetchPutAway(); // Refresh packages after arrival
      }
    } catch (err) {
      console.error('Error updating order status to delivered:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || trans.internalImportOrderDetail.failedToUpdateOrderStatusToDelivered,
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box p={3}>
        <Alert severity="warning">Order not found</Alert>
      </Box>
    );
  }

  // Calculate totals
  const totalQuantity = order.details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0;
  const totalAmount = order.details?.reduce((sum, detail) => sum + (detail.quantity || 0) * (detail.unit_price || 0), 0) || 0;
  const isCompleted = order.status === 'completed';

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            {trans.internalImportOrderDetail.title} #{order._id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trans.internalImportOrderDetail.description}
          </Typography>
        </Box>
      </Box>

      {/* Order Detail Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight="bold">
                {trans.internalImportOrderDetail.orderDetail}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} mb={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.internalImportOrderDetail.status}:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {order.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.internalImportOrderDetail.contract}:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    N/A
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {trans.internalImportOrderDetail.supplier}:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    N/A
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3} display="flex" justifyContent="flex-end" alignItems="center"></Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              <Typography variant="subtitle1" mb={1} fontWeight="bold">
                {trans.internalImportOrderDetail.items}:
              </Typography>
              <Stack spacing={1} mb={2}>
                {order.details?.map((d) => (
                  <Typography key={d._id} variant="body2">
                    • <strong>{d.medicine_id?.medicine_name}</strong> ({d.medicine_id?.license_code}): {d.quantity}
                  </Typography>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Inspection Section */}
      {order.status === 'delivered' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{trans.internalImportOrderDetail.inspection}</Typography>
              <IconButton size="small" onClick={fetchInspection}>
                <RefreshIcon />
              </IconButton>
            </Box>

            <TableContainer component={Paper} elevation={3}>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>{trans.internalImportOrderDetail.medicine}</TableCell>
                    <TableCell>{trans.internalImportOrderDetail.actualQuantity}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inspections.map((insp) => (
                    <TableRow key={insp._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {insp.medicine_id?.medicine_name || ''} ({insp.medicine_id?.license_code || ''})
                        </Typography>
                      </TableCell>
                      <TableCell>{insp.actual_quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="center" mt={2}>
              <Button variant="contained" onClick={onFinishClickInspection} color={confirmFinishInspection ? 'warning' : 'primary'}>
                {confirmFinishInspection ? trans.internalImportOrderDetail.continue : trans.internalImportOrderDetail.finishInspection}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Packages Creation Section */}
      {order.status === 'checked' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {trans.internalImportOrderDetail.packages}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create packages for inventory management
            </Typography>

            <Stack spacing={2}>
              <IconButton size="small" color="primary" onClick={openBatchDialog} sx={{ ml: 2 }} disabled={isCompleted}>
                <AddCircleIcon />
              </IconButton>

              {packages.map((p, idx) => {
                const opt = batchOptions.find((o) => o.id === p.batch_id) || {};
                return (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ flex: 1 }} disabled={isCompleted}>
                      <InputLabel>{trans.internalImportOrderDetail.batch}</InputLabel>
                      <Select size="small" value={p.batch_id} onChange={(e) => handlePkgChange(idx, 'batch_id', e.target.value)}>
                        {allBatchOptions.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label={trans.internalImportOrderDetail.quantity}
                      type="number"
                      value={p.quantity}
                      onChange={(e) => handlePkgChange(idx, 'quantity', e.target.value)}
                      sx={{ width: 120 }}
                      disabled={isCompleted}
                    />
                    <IconButton size="small" onClick={() => removePackageRow(idx)} disabled={isCompleted}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                );
              })}

              <Button onClick={addPackageRow} size="small" disabled={isCompleted}>
                {trans.internalImportOrderDetail.addPackage}
              </Button>

              <Divider />

              {/* VALIDITY STATUS */}
              {isValid ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {trans.internalImportOrderDetail.validInput}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {trans.internalImportOrderDetail.invalidInput}
                  {Object.entries(netByMedicine)
                    .map(([license, netQty]) => {
                      const packedQty = packedByMedicine[license] || 0;
                      const diff = packedQty - netQty;
                      if (diff === 0) return null;
                      const med = uniqueInspections.find((i) => i.medicine_id.license_code === license)?.medicine_id;
                      const name = med?.medicine_name || license;
                      const verb = diff > 0 ? 'over' : 'under';
                      return ` ${name} is ${Math.abs(diff)} unit ${verb}`;
                    })
                    .filter(Boolean)
                    .join('; ')}
                </Alert>
              )}

              <Button variant="contained" disabled={!isValid || saving || isCompleted} onClick={handleContinuePackages}>
                {saving ? trans.internalImportOrderDetail.saving : trans.internalImportOrderDetail.continueToPutAway}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Put Away Section */}
      {(order.status === 'arranged' || order.status === 'completed') && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {trans.internalImportOrderDetail.putAway}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage package locations
            </Typography>

            <Stack spacing={2}>
              <IconButton onClick={fetchPutAway} size="small" sx={{ ml: 2 }}>
                <RefreshIcon />
              </IconButton>

              {loadingPutAway ? (
                <CircularProgress />
              ) : putAway.length === 0 ? (
                <Typography>{trans.internalImportOrderDetail.noPackagesYet}</Typography>
              ) : (
                <Paper>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{trans.internalImportOrderDetail.batch}</TableCell>
                        <TableCell>{trans.internalImportOrderDetail.quantity}</TableCell>
                        <TableCell>{trans.internalImportOrderDetail.status}</TableCell>
                        <TableCell>{trans.internalImportOrderDetail.actions}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {putAway.map((pkg) => (
                        <TableRow key={pkg._id}>
                          <TableCell>
                            {`${pkg.batch_id.batch_code} – ${pkg.batch_id.medicine_id.medicine_name} (${pkg.batch_id.medicine_id.license_code})`}
                          </TableCell>
                          <TableCell>{pkg.quantity}</TableCell>
                          <TableCell>
                            {pkg.location_id ? trans.internalImportOrderDetail.arranged : trans.internalImportOrderDetail.unarranged}
                          </TableCell>
                          <TableCell>
                            {pkg.location_id && (
                              <IconButton size="small" color="error" onClick={() => handleClearLocation(pkg._id)} disabled={isCompleted}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" color="primary" onClick={() => handlePrintLabel(pkg)}>
                              <ReceiptIcon fontSize="small" />
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
                disabled={isCompleted || !putAway.length || !putAway.every((p) => p.location_id)}
                onClick={handleFinalize}
              >
                {trans.internalImportOrderDetail.finalize}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {/* Change Status removed for WM internal detail */}

      {/* Status Change Dialog removed */}

      {/* Create Batch Dialog */}
      <Dialog open={batchDialogOpen} onClose={closeBatchDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{trans.internalImportOrderDetail.createNewBatch}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>{trans.internalImportOrderDetail.medicine}</InputLabel>
                <Select
                  value={newMedicineId}
                  onChange={(e) => setNewMedicineId(e.target.value)}
                  label={trans.internalImportOrderDetail.medicine}
                >
                  {order?.details?.map((detail) => (
                    <MenuItem key={detail.medicine_id._id} value={detail.medicine_id._id}>
                      {detail.medicine_id.medicine_name} ({detail.medicine_id.license_code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={trans.internalImportOrderDetail.batchCode}
                value={newBatchCode}
                onChange={(e) => setNewBatchCode(e.target.value)}
                placeholder="e.g., BATCH-2024-001"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={trans.internalImportOrderDetail.productionDate}
                type="date"
                value={newProdDate}
                onChange={(e) => setNewProdDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={trans.internalImportOrderDetail.expiryDate}
                type="date"
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {batchError && (
              <Grid item xs={12}>
                <Alert severity="error">{batchError}</Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBatchDialog}>{trans.internalImportOrderDetail.cancel}</Button>
          <Button
            onClick={handleCreateBatch}
            variant="contained"
            disabled={!newMedicineId || !newBatchCode || !newProdDate || !newExpiryDate}
          >
            {trans.internalImportOrderDetail.createBatch}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InternalImportOrderDetail;
