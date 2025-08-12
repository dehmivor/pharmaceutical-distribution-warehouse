'use client';
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  CircularProgress,
  Snackbar,
  Switch,
  FormControlLabel,
  Paper,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

// explicit imports (more compatible across versions)
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const RepresentativeManagerMedicinePerformance = () => {
  const [licenseCode, setLicenseCode] = useState('');
  const [months, setMonths] = useState([]); // for inventory-flow
  const [importContracted, setImportContracted] = useState([]);
  const [importUncontracted, setImportUncontracted] = useState([]);
  const [exportContracted, setExportContracted] = useState([]);
  const [exportUncontracted, setExportUncontracted] = useState([]);

  // history endpoint states
  const [historyMonths, setHistoryMonths] = useState([]);
  const [historyQuantity, setHistoryQuantity] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUncontracted, setShowUncontracted] = useState(true);

  const resetData = () => {
    setMonths([]);
    setImportContracted([]);
    setImportUncontracted([]);
    setExportContracted([]);
    setExportUncontracted([]);
    setHistoryMonths([]);
    setHistoryQuantity([]);
  };

  // ensure numeric arrays of length len (pad with zeros)
  const safeNumericArray = (arr, len) => {
    const out = Array.from({ length: len }, () => 0);
    if (!Array.isArray(arr)) return out;
    for (let i = 0; i < len; i++) {
      const v = arr[i];
      const n = Number(v);
      out[i] = Number.isFinite(n) ? n : 0;
    }
    return out;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!licenseCode) {
        setError('Please enter a license code');
        return;
      }
      setLoading(true);
      setError('');
      resetData();

      try {
        const code = encodeURIComponent(licenseCode);

        // call both endpoints in parallel
        const flowUrl = `/api/medicine/${code}/inventory-flow-last-12-months`;
        const historyUrl = `/api/log-location-changes/${code}/getHistoryLast6Months`;

        const [flowResp, historyResp] = await Promise.all([
          axios.get(flowUrl, { headers: getAuthHeaders() }).catch((err) => ({ error: err })),
          axios.get(historyUrl, { headers: getAuthHeaders() }).catch((err) => ({ error: err })),
        ]);

        // process flowResp
        if (!flowResp || flowResp.error) {
          // only treat missing flow as non-fatal if we still can show history; but show message
          console.warn('flow request failed', flowResp?.error || flowResp);
          setError('Failed to fetch inventory flow (bar chart).');
        } else {
          const data = flowResp.data;
          if (!data || !data.success) {
            console.warn('flow response invalid', data);
            setError('Invalid inventory flow response.');
          } else {
            const respMonths = Array.isArray(data.meta?.months) ? data.meta.months.map((m) => String(m)) : [];
            const imp = data.data?.import || {};
            const exp = data.data?.export || {};

            const len = respMonths.length || 0;
            setMonths(respMonths);

            setImportContracted(safeNumericArray(imp.contracted_order, len));
            setImportUncontracted(safeNumericArray(imp.uncontracted_order, len));
            setExportContracted(safeNumericArray(exp.contracted_order, len));
            setExportUncontracted(safeNumericArray(exp.uncontracted_order, len));
          }
        }

        // process historyResp
        if (!historyResp || historyResp.error) {
          console.warn('history request failed', historyResp?.error || historyResp);
          // not fatal; show message if nothing else
          setError((prev) => prev ? prev + ' Also failed to fetch history.' : 'Failed to fetch history data (line chart).');
        } else {
          const data = historyResp.data;
          if (!data || !data.success) {
            console.warn('history response invalid', data);
            setError((prev) => prev ? prev + ' History response invalid.' : 'Invalid history response.');
          } else {
            const hMonths = Array.isArray(data.data.months) ? data.data.months.map((m) => String(m)) : [];
            const quantities = data.data?.quantity || [];
            const len = hMonths.length || 0;
            setHistoryMonths(hMonths);
            setHistoryQuantity(safeNumericArray(quantities, len));
          }
          
        }

        // if both failed, keep error set (already set above)
      } catch (err) {
        console.error('fetch error:', err);
        setError(err?.response?.data?.error || err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    },
    [licenseCode],
  );

  // Build series for BarChart
  const buildBarSeries = () => {
    const len = months.length || 0;
    const zeros = Array(len).fill(0);
    const impContractedSafe = Array.isArray(importContracted) && importContracted.length === len ? importContracted : zeros;
    const impUn = showUncontracted && Array.isArray(importUncontracted) && importUncontracted.length === len ? importUncontracted : zeros;
    const expContractedSafe = Array.isArray(exportContracted) && exportContracted.length === len ? exportContracted : zeros;
    const expUn = showUncontracted && Array.isArray(exportUncontracted) && exportUncontracted.length === len ? exportUncontracted : zeros;

    return [
      { label: 'Import — Contracted', data: impContractedSafe, stack: 'import' },
      { label: 'Import — Uncontracted', data: impUn, stack: 'import' },
      { label: 'Export — Contracted', data: expContractedSafe, stack: 'export' },
      { label: 'Export — Uncontracted', data: expUn, stack: 'export' },
    ];
  };

  // Build series for LineChart
   const buildLineSeries = () => {
    const len = historyMonths.length || 0;
    const qty = Array.isArray(historyQuantity) && historyQuantity.length === len ? historyQuantity : Array(len).fill(0);
    return [{ label: 'Quantity (log history)', data: qty }];
  };

  const canRenderBar = () => {
    const len = months.length;
    if (!Array.isArray(months) || len === 0) return false;
    return [importContracted, importUncontracted, exportContracted, exportUncontracted].every((a) => Array.isArray(a) && a.length === len);
  };

  const canRenderLine = () => {
    const len = historyMonths.length;
    if (!Array.isArray(historyMonths) || len === 0) return false;
    return Array.isArray(historyQuantity) && historyQuantity.length === len;
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', fontWeight: 600 }}>
        Medicine performance
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        Display the performance of notable medicine in the warehouse
      </Typography>

      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <RefreshIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Search
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  label="Medicine license code"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ px: 3 }}>
                  {loading ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setLicenseCode('');
                    resetData();
                  }}
                  sx={{ px: 3 }}
                >
                  Clear
                </Button>

                <FormControlLabel
                  control={<Switch checked={showUncontracted} onChange={(e) => setShowUncontracted(e.target.checked)} color="primary" />}
                  label="Show Uncontracted"
                  sx={{ ml: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* Charts row: Bar (2/3) | Line (1/3) */}
      <Grid container spacing={2} alignItems="stretch">
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Inventory flow
              </Typography>
            </Box>
            <CardContent>
              {loading && months.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress />
                </Box>
              ) : months.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Enter a medicine license code and submit to see statistics.
                  </Typography>
                </Paper>
              ) : !canRenderBar() ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Data shape is invalid for chart. Check console for details.
                  </Typography>
                </Paper>
              ) : (
                <BarChart
                  key={months.join('-')}
                  series={buildBarSeries()}
                  xAxis={[{ data: months }]}
                  height={420}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid  size={{ xs: 12, md: 4 }}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Log history (last 6 months)
              </Typography>
            </Box>
            <CardContent>
              {loading && historyMonths.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : historyMonths.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No log history available.
                  </Typography>
                </Paper>
              ) : !canRenderLine() ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Data shape is invalid for line chart.
                  </Typography>
                </Paper>
              ) : (
                <BarChart
                  key={months.join('-')}
                  series={buildLineSeries()}
                  xAxis={[{ data: historyMonths }]}
                  height={420}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={!!error} onClose={() => setError('')} autoHideDuration={6000} message={error} />
    </Box>
  );
};

export default RepresentativeManagerMedicinePerformance;
