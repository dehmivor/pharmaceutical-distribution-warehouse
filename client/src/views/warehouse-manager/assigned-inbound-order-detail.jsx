'use client';

import bwipjs from 'bwip-js/browser';
import ReceiptIcon from '@mui/icons-material/Receipt';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import {
  Accordion, AccordionSummary, AccordionDetails, Box, Button, Container, Divider, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, MenuItem, Select,
  Stack, TextField, Typography, CircularProgress, Alert, IconButton, Table, TableHead, TableBody,
  TableRow, TableContainer, TableCell, Tooltip, Paper, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { useTheme } from '@mui/material/styles';
import { constant } from 'lodash-es';
import useTrans from '@/hooks/useTrans';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ImportOrderDetail() {
  const theme = useTheme();
  const trans = useTrans();
  const { orderId } = useParams();
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

  const [validBatchOptions, setValidBatchOptions] = useState([]);

  const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
  const userId = userData.userId;

  const [confirmFinishInspection, setConfirmFinishInspection] = useState(false);
  const [batchOptions, setBatchOptions] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  const [assignLoading, setAssignLoading] = useState(false);
  const [downloadReceiptLoading, setdownloadReceiptLoading] = useState(false);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [packageLoading, setPackageLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

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

  useEffect(() => {
    // whenever `inspections` changes, recalculate `packages`
    if (inspections.length) {
      const pre = inspections.map((i) => ({
        batch_id: i.batch_id?._id || '',
        quantity: i.actual_quantity - i.rejected_quantity
      }));
      setPackages(pre);
    }
  }, [inspections]);

  useEffect(() => {
    // build a set of all medicineIds in the inspections
    const meds = Array.from(new Set(inspections.map((i) => i.medicine_id?._id).filter(Boolean)));
    if (meds.length === 0) {
      setValidBatchOptions([]);
      return;
    }

    (async () => {
      try {
        // fetch valid batches for each medicine
        const results = await Promise.all(meds.map((mid) => axios.get(`/api/batch/valid/${mid}`, { headers: getAuthHeaders() })));
        // flatten into { id, label } shape
        const serverOpts = results.flatMap((r) =>
          (r.data.data || []).map((b) => ({
            id: b._id,
            // combine batch code + medicine name + license code
            label: `${b.batch_code} - ${b.medicine_id.medicine_name} (${b.medicine_id.license_code})`,
            max: b.quantity // if you still need max
          }))
        );
        setValidBatchOptions(serverOpts);
      } catch (err) {
        console.error('Failed to load valid batches:', err);
        setValidBatchOptions([]);
      }
    })();
  }, [inspections, newBatches]);

  const prefillPackages = (insps) => {
    const pre = insps.map((i) => ({
      batch_id: i.batch_id?._id || '',
      quantity: i.actual_quantity - i.rejected_quantity
    }));
    setPackages(pre);
  };

  const fetchInspection = async () => {
    try {
      const { data: inspResp } = await axios.get(`/api/import-inspections/import-orders/${orderId}/inspections`, {
        headers: getAuthHeaders()
      });
      const insps = inspResp.inspections || [];
      setInspections(insps);
      prefillPackages(insps);
    } catch (err) {
      console.error(err);
      setPutAway([]);
    }
  };

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

  const handleClearLocation = async (pkgId) => {
    try {
      const ware_house_id = userId;
      const import_order_id = orderId;

      await axios.patch(
        `/api/packages/${pkgId}/clear-location`,
        {
          ware_house_id,
          import_order_id
        },
        { headers: getAuthHeaders() }
      );
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

    // Lookup the medicine object so we can grab name & license
    const medDoc = uniqueInspections.find((i) => i.medicine_id._id === newMedicineId)?.medicine_id;

    // stash locally
    setNewBatches((list) => [
      ...list,
      {
        medicine_id: newMedicineId,
        medicine_name: medDoc?.medicine_name || '—',
        license_code: medDoc?.license_code || '—',
        batch_code: newBatchCode,
        production_date: newProdDate,
        expiry_date: newExpiryDate
      }
    ]);
    // add a temp option so users can pick it immediately
    setBatchOptions((opts) => [
      ...opts,
      {
        id: newBatchCode,
        label: `${newBatchCode} – ${medDoc?.medicine_name || ''} (${medDoc?.license_code || ''})`,
        max: 0
      }
    ]);

    closeBatchDialog();
  };

  const uniqueInspections = inspections
    .filter((i) => i.medicine_id && i.medicine_id._id)
    .filter((i, idx, arr) => arr.findIndex((j) => j.medicine_id._id === i.medicine_id._id) === idx);

  const allBatchOptions = [
    ...validBatchOptions,
    ...newBatches.map((nb) => ({
      id: nb.batch_code,
      label: `(new) ${nb.batch_code} – ${nb.medicine_name} (${nb.license_code})`,
      max: 0
    }))
  ].reduce((acc, opt) => {
    if (!acc.find((o) => o.id === opt.id)) acc.push(opt);
    return acc;
  }, []);

  function getLicenseCodeById(id, array) {
    const item = array.find((el) => el.id === id);
    if (!item) return null;

    const match = item.label.match(/\(([^)]+)\)$/); // extract text inside the last parentheses
    return match ? match[1] : null;
  }

  function validatePackages({ packages, inspections, allBatchOptions, uniqueInspections }) {
    // 1) quick checks
    if (!packages || packages.length === 0) {
      return { valid: false, message: trans.assignedInboundOrderDetail.mustAddPackageRow };
    }

    // any row missing batch?
    const missingBatch = packages.some((p) => !p.batch_id);
    if (missingBatch) {
      return { valid: false, message: trans.assignedInboundOrderDetail.everyRowMustHaveBatch };
    }

    // any row with non-positive quantity?
    const anyNonPositive = packages.some((p) => Number(p.quantity) <= 0 || p.quantity === '' || p.quantity == null);
    if (anyNonPositive) {
      return { valid: false, message: trans.assignedInboundOrderDetail.quantitiesMustBePositive };
    }

    // 2) Build metrics: medicineId -> net inspected qty
    const netByMedicine = inspections.reduce((acc, ins) => {
      const medId = ins.medicine_id?.license_code;
      if (!medId) return acc;
      const net = Number(ins.actual_quantity || 0) - Number(ins.rejected_quantity || 0);
      acc[medId] = (acc[medId] || 0) + net;
      return acc;
    }, {});

    // 3) Build metrics: medicineId -> total packaged qty
    const packedByMedicine = packages.reduce((acc, pkg) => {
      const medId = getLicenseCodeById(pkg.batch_id, allBatchOptions);
      if (!medId) return acc;
      acc[medId] = (acc[medId] || 0) + Number(pkg.quantity || 0);
      return acc;
    }, {});

    // 4) quick mismatch: distinct medicine counts
    if (Object.keys(netByMedicine).length !== Object.keys(packedByMedicine).length) {
      return { valid: false, message: trans.assignedInboundOrderDetail.medicineCountMismatch };
    }

    // 5) detailed diff: find over/under per medicine
    const diffs = Object.entries(netByMedicine)
      .map(([medId, netQty]) => {
        const packedQty = packedByMedicine[medId] || 0;
        const diff = packedQty - netQty; // positive => over, negative => under
        return { medId, netQty, packedQty, diff };
      })
      .filter((d) => d.diff !== 0);

    if (diffs.length > 0) {
      // Build a concise message; use uniqueInspections to map license -> human name when possible
      const messages = diffs.map((d) => {
        const med = uniqueInspections.find((i) => i.medicine_id.license_code === d.medId)?.medicine_id;
        const name = med?.medicine_name || d.medId;
        const verb = d.diff > 0 ? 'over' : 'under';
        return `${name} is ${Math.abs(d.diff)} unit ${verb}`;
      });
      return { valid: false, message: messages.join('; ') };
    }

    // all checks passed
    return { valid: true, message: trans.assignedInboundOrderDetail.validInput };
  }

  const validation = validatePackages({ packages, inspections, allBatchOptions, uniqueInspections });

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

  const handleDeleteInspection = async (inspectionId) => {
    try {
      const token = localStorage.getItem('auth-token');
      await axios.delete(`/api/inspections/${inspectionId}`, {
        headers: getAuthHeaders()
      });

      // Remove it directly from the inspections array
      setInspections((prev) => prev.filter((insp) => insp._id !== inspectionId));
      fetchInspection();
    } catch (error) { }
  };

  const onFinishClickInspection = async () => {
    if (!confirmFinishInspection) {
      // first click: re-fetch inspections and enter “confirm” mode
      await fetchInspection();
      setConfirmFinishInspection(true);
    } else {
      // second click: actually finish
      handleFinishInspection();
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
      setError(trans.assignedInboundOrderDetail.errorPrintingLabel);
    }
  };



  const handleDownloadReceipt = async () => {
    try {
      setdownloadReceiptLoading(true)
      const response = await axios.get(`/api/import-orders/receipt/${orderId}`, {
        headers: getAuthHeaders(),
        responseType: "blob", // <- important: get binary blob
      });

      // Try to extract filename from Content-Disposition
      const contentDisposition = response.headers["content-disposition"] || "";
      let filename = "receipt.docx"; // fallback

      // support filename*=UTF-8''encoded-name, filename="name", filename=name
      const filenameRegex = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches) {
        filename = decodeURIComponent(matches[1] || matches[2] || matches[3]).trim();
      }

      // create a blob and trigger download
      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });

      // IE / Edge (msSaveOrOpenBlob)
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }

      // Other browsers
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // release memory
      window.URL.revokeObjectURL(url);
      setdownloadReceiptLoading(false)
    } catch (err) {
      console.error("Error downloading receipt:", err);
      setError(trans.assignedInboundOrderDetail.errorAssigningOrder);
    }
  };


  const handleSelfAssign = async () => {
    try {
      await axios.patch(
        `/api/import-orders/${orderId}/assign-warehouse-manager`,
        { warehouse_manager_id: userId },
        {
          headers: getAuthHeaders()
        }
      );
    } catch (err) {
      console.error('Error assign self:', err);
      setError(trans.assignedInboundOrderDetail.errorAssigningOrder);
    }
  };

  const handleArrival = async () => {
    try {
      setAssignLoading(true);
      if (!order.warehouse_manager_id) {
        await handleSelfAssign();
      }
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'delivered' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'delivered' }));
      enableAccordion('delivered');
      setAssignLoading(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(trans.assignedInboundOrderDetail.errorUpdatingStatus);
    }
  };

  const handleFinishInspection = async () => {
    try {
      setInspectionLoading(true);
      await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'checked' },
        {
          headers: getAuthHeaders()
        }
      );
      setOrder((prev) => ({ ...prev, status: 'checked' }));
      enableAccordion('checked');
      setInspectionLoading(false);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(trans.assignedInboundOrderDetail.errorUpdatingStatus);
    }
  };

  const handleContinuePackages = async () => {
    if (!validation.valid) return;
    setSaving(true);

    try {
      setPackageLoading(true);
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
            supplier_id: order.contract_id.partner_id._id
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
      setPackageLoading(false);
    } catch (err) {
      console.error(err);
      setError(trans.assignedInboundOrderDetail.errorCreatingBatches);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setFinalizeLoading(true);
      const response = await axios.patch(
        `/api/import-orders/${orderId}/status`,
        { status: 'completed' },
        {
          headers: getAuthHeaders()
        }
      );

      if (response.status >= 200 && response.status < 300) {
        const orderData = response.data.data;

        setOrder((prev) => ({ ...prev, status: 'completed' }));
        enableAccordion('other');

        console.log('data trả về lúc completed', response.data.data);

        if (!orderData.contract_id) {
          console.log('Không có contract_id, không tạo bill');
          setFinalizeLoading(false);
          return;
        }

        const billDetails = (orderData.details || []).map((item) => ({
          medicine_lisence_code: item.medicine_id.license_code,
          quantity: item.quantity,
          unit_price: item.unit_price
        }));

        if (billDetails.length === 0) {
          setError(trans.assignedInboundOrderDetail.noOrderDetailsForBill);
          return;
        }

        const billPayload = {
          import_order_id: orderData._id,
          type: 'IMPORT',
          status: 'pending',
          details: billDetails
        };

        console.log('bill data', billPayload);
        try {
          const createBillRes = await axios.post(`/api/bills`, billPayload, {
            headers: getAuthHeaders()
          });

          if (createBillRes.data.success) {
            console.log('Bill mới đã được tạo:', createBillRes.data.data);
          } else {
            setError(trans.assignedInboundOrderDetail.errorCreatingBill + ': ' + createBillRes.data.message);
          }
        } catch (billErr) {
          console.error('Lỗi khi gọi API tạo bill:', billErr);
          setError(trans.assignedInboundOrderDetail.errorCreatingBill);
        }
      }
      setFinalizeLoading(false);
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái đơn:', err);
      setError(trans.assignedInboundOrderDetail.errorUpdatingStatus);
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
      <Container>
        <Typography variant="h4" gutterBottom>
          {trans.assignedInboundOrderDetail.title} #{order._id}
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          {trans.assignedInboundOrderDetail.description}
        </Typography>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6" fontWeight="bold">
              {trans.assignedInboundOrderDetail.orderDetail}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.assignedInboundOrderDetail.status}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.status}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.assignedInboundOrderDetail.contract}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id.contract_code}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  {trans.assignedInboundOrderDetail.supplier}:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {order.contract_id.partner_id.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3} display="flex" justifyContent="flex-end" alignItems="center">
                <Button
                  variant="contained"
                  disabled={order.status !== 'approved'}
                  onClick={handleArrival}
                  size="large"
                  loading={assignLoading}
                >
                  {trans.assignedInboundOrderDetail.arrived}
                </Button>

                <Button
                  variant="contained"
                  disabled={order.status !== 'checked' && order.status !== 'arranged' && order.status !== 'completed'}
                  onClick={handleDownloadReceipt}
                  size="large"
                  loading={downloadReceiptLoading}
                  style={{'marginLeft' : '5px'}}
                >
                  {trans.assignedInboundOrderDetail.printReceipt}
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle1" mb={1} fontWeight="bold">
              {trans.assignedInboundOrderDetail.items}:
            </Typography>
            <Stack spacing={1} mb={2}>
              {order.details.map((d) => (
                <Typography key={d._id} variant="body2">
                  • <strong>{d.medicine_id.medicine_name}</strong> ({d.medicine_id.license_code}): {d.quantity}
                </Typography>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Inspection */}
        <Accordion disabled={inspectionsDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{trans.assignedInboundOrderDetail.inspection}</Typography>
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
                      <TableCell>{trans.assignedInboundOrderDetail.medicine}</TableCell>
                      <TableCell>{trans.assignedInboundOrderDetail.actualQuantity}</TableCell>
                      <TableCell>{trans.assignedInboundOrderDetail.rejectedQuantity}</TableCell>
                      <TableCell>{trans.assignedInboundOrderDetail.actions}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inspections.map((insp) => (
                      <TableRow key={insp._id} hover>
                        <TableCell>
                          <Tooltip title={insp._id}>
                            <Typography variant="body2" fontWeight="bold">
                              {insp.medicine_id?.medicine_name || ''} ({insp.medicine_id?.license_code || ''})
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

              <Button
                variant="contained"
                disabled={inspectionsDone}
                onClick={onFinishClickInspection}
                color={confirmFinishInspection ? 'warning' : 'primary'}
                loading={inspectionLoading}
              >
                {confirmFinishInspection ? trans.assignedInboundOrderDetail.continue : trans.assignedInboundOrderDetail.finishInspection}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Packages Creation */}
        <Accordion disabled={packagesDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{trans.assignedInboundOrderDetail.packages}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Button
                size="small"
                color="primary"
                onClick={openBatchDialog}
                disabled={packagesDone}
                sx={{ ml: 2 }}
                startIcon={<AddCircleIcon />}
              >
                {trans.assignedInboundOrderDetail.newBatch}
              </Button>
              {packages.map((p, idx) => {
                const opt = batchOptions.find((o) => o.id === p.batch_id) || {};
                return (
                  <Stack key={idx} direction="row" spacing={2} alignItems="center">
                    <FormControl sx={{ flex: 1 }} disabled={packagesDone}>
                      <InputLabel>{trans.assignedInboundOrderDetail.batch}</InputLabel>
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
                      label={trans.assignedInboundOrderDetail.quantity}
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
                {trans.assignedInboundOrderDetail.addPackage}
              </Button>

              <Divider />

              {/* ▶︎ VALIDITY STATUS */}
              {!packagesDone && (
                <Alert severity={validation.valid ? 'success' : 'error'} sx={{ mb: 2 }}>
                  {validation.message}
                </Alert>
              )}

              <Button
                variant="contained"
                disabled={!validation.valid || saving || packagesDone}
                loading={packageLoading}
                onClick={handleContinuePackages}
              >
                {saving ? trans.assignedInboundOrderDetail.saving : trans.assignedInboundOrderDetail.continueToPutAway}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Put Away */}
        <Accordion disabled={putAwayDone} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{trans.assignedInboundOrderDetail.putAway}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <IconButton onClick={fetchPutAway} size="small" sx={{ ml: 2 }} disabled={putAwayDone}>
                <RefreshIcon />
              </IconButton>
              {loadingPutAway ? (
                <CircularProgress />
              ) : putAway.length === 0 ? (
                <Typography>{trans.assignedInboundOrderDetail.noPackagesYet}</Typography>
              ) : (
                <Paper>
                  <Table size="small" disabled={putAwayDone}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{trans.assignedInboundOrderDetail.batch}</TableCell>
                        <TableCell>{trans.assignedInboundOrderDetail.quantity}</TableCell>
                        <TableCell>{trans.assignedInboundOrderDetail.status}</TableCell>
                        <TableCell>{trans.assignedInboundOrderDetail.actions}</TableCell>
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
                            {pkg.location_id ? trans.assignedInboundOrderDetail.arranged : trans.assignedInboundOrderDetail.unarranged}
                          </TableCell>
                          <TableCell>
                            {pkg.location_id && (
                              <IconButton size="small" color="error" onClick={() => handleClearLocation(pkg._id)} disabled={putAwayDone}>
                                <DeleteForeverIcon fontSize="small" />
                              </IconButton>
                            )}
                            <IconButton size="small" color="primary" onClick={() => handlePrintLabel(pkg)} disabled={putAwayDone}>
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
                disabled={!putAway.length || !putAway.every((p) => p.location_id) || putAwayDone}
                onClick={handleFinalize}
                loading={finalizeLoading}
              >
                {trans.assignedInboundOrderDetail.finalize}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
        {/* Batch Creation Dialog */}
        <Dialog open={batchDialogOpen} onClose={closeBatchDialog}>
          <DialogTitle>{trans.assignedInboundOrderDetail.createNewBatch}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
              <TextField
                label={trans.assignedInboundOrderDetail.batchCode}
                value={newBatchCode}
                onChange={(e) => setNewBatchCode(e.target.value)}
                required
              />
              <FormControl fullWidth>
                <InputLabel>{trans.assignedInboundOrderDetail.medicine}</InputLabel>
                <Select
                  value={newMedicineId}
                  label={trans.assignedInboundOrderDetail.medicine}
                  onChange={(e) => setNewMedicineId(e.target.value)}
                >
                  {uniqueInspections.map((i) => (
                    <MenuItem key={i._id} value={i.medicine_id?._id}>
                      {i.medicine_id?.medicine_name || '—'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label={trans.assignedInboundOrderDetail.productionDate}
                type="date"
                value={newProdDate}
                onChange={(e) => {
                  const prod = e.target.value;
                  setNewProdDate(prod);

                  // If the current expiry is before the new production, bump it forward
                  if (newExpiryDate && newExpiryDate < prod) {
                    setNewExpiryDate(prod);
                  }
                }}
                slotProps={{
                  input: { max: today },
                  inputLabel: { shrink: true }
                }}
              />

              <TextField
                label={trans.assignedInboundOrderDetail.expiryDate}
                type="date"
                slotProps={{
                  input: { min: newProdDate || undefined },
                  inputLabel: { shrink: true }
                }}
                value={newExpiryDate}
                onChange={(e) => setNewExpiryDate(e.target.value)}
              />
              {batchError && <Alert severity="error">{batchError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeBatchDialog} disabled={creatingBatch}>
              {trans.assignedInboundOrderDetail.cancel}
            </Button>
            <Button variant="contained" onClick={handleCreateBatch} disabled={creatingBatch}>
              {creatingBatch ? trans.assignedInboundOrderDetail.creating : trans.assignedInboundOrderDetail.createBatch}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ImportOrderDetail;
