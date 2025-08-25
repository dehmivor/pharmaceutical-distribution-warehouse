'use client';
import React, { useState, useCallback, useEffect } from 'react';
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
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Stack
} from '@mui/material';
import { Refresh as RefreshIcon, Search } from '@mui/icons-material';
import axios from 'axios';

// explicit imports (more compatible across versions)
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
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

  // top exported medicines
  const [topExported, setTopExported] = useState([]);
  const [topLoading, setTopLoading] = useState(false);

  // --- Distinct batches (minimal) ---
  const [batches, setBatches] = useState([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState('');
  const [monthsFilter, setMonthsFilter] = useState(''); // empty = no filter

  const [aiResponse, setaiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : '—');
  const monthsUntil = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const diffMs = d.getTime() - Date.now();
    // simple month approximation: 30 days/month
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  };

  const fetchDistinctBatches = useCallback(async () => {
    setBLoading(true);
    setBError('');
    try {
      const { data } = await axios.get('/api/packages/distinct-batches', { headers: getAuthHeaders() });
      if (!data?.success) throw new Error('Invalid response');
      const rows = (data.data || []).map((r) => ({
        _id: r._id,
        medicine_name: r.medicine_id?.medicine_name || '—',
        license_code: r.medicine_id?.license_code || '—',
        batch_code: r.batch_code || '—',
        production_date: r.production_date || null,
        expiry_date: r.expiry_date || null
      }));
      setBatches(rows);
    } catch (e) {
      setBError(e?.response?.data?.error || e.message || 'Failed to load batches');
    } finally {
      setBLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDistinctBatches();
  }, [fetchDistinctBatches]);

  const filteredBatches = React.useMemo(() => {
    const m = parseFloat(monthsFilter);
    if (!Number.isFinite(m) || m < 0) return batches; // no/invalid filter → show all
    return batches.filter((row) => {
      const mu = monthsUntil(row.expiry_date);
      return mu !== null && mu <= m; // "expiring within ≤ N months"
    });
  }, [batches, monthsFilter]);

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

  // fetch top exported on mount so the table shows automatically
  useEffect(() => {
    let cancelled = false;
    const fetchTop = async () => {
      setTopLoading(true);
      try {
        const topExportUrl = `/api/export-orders/exportedTotalsLast6MonthsTop5`;
        const resp = await axios.get(topExportUrl, { headers: getAuthHeaders() });
        if (!cancelled) {
          if (resp?.data?.success) {
            const items = Array.isArray(resp.data.data) ? resp.data.data : [];
            setTopExported(items.slice(0, 5));
          } else {
            console.warn('Invalid top exported response on mount', resp?.data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch top exported on mount', err);
          // non-fatal; show a small snackbar if desired
          setError('Failed to load top exported medicines.');
        }
      } finally {
        if (!cancelled) setTopLoading(false);
      }
    };

    fetchTop();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e?.preventDefault();
      if (!licenseCode) {
        setError('Please enter a license code');
        return;
      }
      setLoading(true);
      setError('');
      setaiResponse('');
      setAiLoading(true);
      resetData();

      try {
        const code = encodeURIComponent(licenseCode);

        // call endpoints in parallel (flow, history, AI)
        const flowUrl = `/api/medicine/${code}/inventory-flow-last-12-months`;
        const historyUrl = `/api/log-location-changes/${code}/getHistoryLast6Months`;
        const aiUrl = `/api/ai-trends/ai-medicine-performance/${code}`;

        const [flowResp, historyResp, aiResp] = await Promise.all([
          axios.get(flowUrl, { headers: getAuthHeaders() }).catch((err) => ({ error: err })),
          axios.get(historyUrl, { headers: getAuthHeaders() }).catch((err) => ({ error: err })),
          axios.get(aiUrl, { headers: getAuthHeaders(), responseType: 'text' }).catch((err) => ({ error: err }))
        ]);

        // process flowResp
        if (!flowResp || flowResp.error) {
          console.warn('flow request failed', flowResp?.error || flowResp);
          setError((prev) => (prev ? prev + ' Inventory flow failed.' : 'Failed to fetch inventory flow (bar chart).'));
        } else {
          const data = flowResp.data;
          if (!data || !data.success) {
            console.warn('flow response invalid', data);
            setError((prev) => (prev ? prev + ' Inventory flow invalid.' : 'Invalid inventory flow response.'));
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
          setError((prev) => (prev ? prev + ' Also failed to fetch history.' : 'Failed to fetch history data (line chart).'));
        } else {
          const data = historyResp.data;
          if (!data || !data.success) {
            console.warn('history response invalid', data);
            setError((prev) => (prev ? prev + ' History response invalid.' : 'Invalid history response.'));
          } else {
            const hMonths = Array.isArray(data.data.months) ? data.data.months.map((m) => String(m)) : [];
            const quantities = data.data?.quantity || [];
            const len = hMonths.length || 0;
            setHistoryMonths(hMonths);
            setHistoryQuantity(safeNumericArray(quantities, len));
          }
        }
        setLoading(false);

        // process aiResp (raw text)
        if (!aiResp || aiResp.error) {
          console.warn('ai request failed', aiResp?.error || aiResp);
          // non-fatal, just show a message in the AI card
          setaiResponse('');
          setError((prev) => (prev ? prev + ' AI summary failed.' : 'Failed to fetch AI summary.'));
        } else {
          // server returns raw text/plain; axios with responseType 'text' gives string in data
          const text = aiResp.data;
          // normalize to string
          const s = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
          setaiResponse(s);
        }
        setAiLoading(false);
      } catch (err) {
        console.error('fetch error:', err);
        setError(err?.response?.data?.error || err.message || 'Failed to fetch data');
      }
    },
    [licenseCode]
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
      { label: 'Export — Uncontracted', data: expUn, stack: 'export' }
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Medicine performance
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Display the performance of notable medicine in the warehouse
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Search
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  size="small"
                  label="Medicine license code"
                  value={licenseCode}
                  onChange={(e) => setLicenseCode(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  sx={{ ml: 1 }}
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  size="small"
                  fullWidth
                  startIcon={<Search />}
                >
                  {loading ? <CircularProgress size={20} /> : 'Submit'}
                </Button>
                <Button
                  size="small"
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setLicenseCode('');
                    resetData();
                  }}
                >
                  Clear
                </Button>

                <FormControlLabel
                  control={<Switch checked={showUncontracted} onChange={(e) => setShowUncontracted(e.target.checked)} color="primary" />}
                  label="Show Uncontracted"
                  sx={{ ml: 1 }}
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
                    Enter a medicine license code.
                  </Typography>
                </Paper>
              ) : !canRenderBar() ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Data shape is invalid for chart. Check console for details.
                  </Typography>
                </Paper>
              ) : (
                <BarChart key={months.join('-')} series={buildBarSeries()} xAxis={[{ data: months }]} height={420} />
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
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
                  <Typography variant="body1" color="text.secondary">
                    Enter a medicine license code.
                  </Typography>
                </Paper>
              ) : !canRenderLine() ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Data shape is invalid for line chart.
                  </Typography>
                </Paper>
              ) : (
                <BarChart key={months.join('-')} series={buildLineSeries()} xAxis={[{ data: historyMonths }]} height={420} />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Card sx={{ border: '1px solid #e0e0e0' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              AI summary
            </Typography>
          </Box>
          <CardContent>
            {aiLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : months.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Enter a medicine license code.
                </Typography>
              </Paper>
            ) : !aiResponse ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No AI summary yet.
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ p: 2, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {aiResponse}
                </Typography>
              </Paper>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Top exported table (full width below charts) */}
      <Box sx={{ mt: 2 }}>
        <Card sx={{ border: '1px solid #e0e0e0' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Top exported medicines (last 6 months)
            </Typography>
          </Box>
          <CardContent>
            {topLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : topExported.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No exported medicines found in the last 6 months.
                </Typography>
              </Paper>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Medicine name</TableCell>
                      <TableCell>License code</TableCell>
                      <TableCell align="right">Total exported</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topExported.map((row, idx) => (
                      <TableRow key={String(row.medicine_id || idx)}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{row.medicine_name || '—'}</TableCell>
                        <TableCell>{row.license_code || '—'}</TableCell>
                        <TableCell align="right">{Number(row.totalExported).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 2 }}>
          <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid #e0e0e0',
                bgcolor: 'grey.50',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Almost expire
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <TextField
                  type="number"
                  size="small"
                  label="Expiring within (months)"
                  value={monthsFilter}
                  onChange={(e) => setMonthsFilter(e.target.value)}
                  placeholder="e.g. 6"
                  sx={{ width: 220 }}
                  inputProps={{ min: 0 }}
                />
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchDistinctBatches} disabled={bLoading}>
                  Refresh
                </Button>
              </Box>
            </Box>

            <CardContent sx={{ p: 0 }}>
              {bLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : bError ? (
                <Paper sx={{ p: 3, m: 2, textAlign: 'center' }}>
                  <Typography color="error">{bError}</Typography>
                </Paper>
              ) : filteredBatches.length === 0 ? (
                <Paper sx={{ p: 3, m: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">No batches match the filter.</Typography>
                </Paper>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Medicine name</TableCell>
                        <TableCell>License code</TableCell>
                        <TableCell>Batch code</TableCell>
                        <TableCell align="right">Production date</TableCell>
                        <TableCell align="right">Expiry date</TableCell>
                        <TableCell align="right">Months to expiry</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBatches.map((row) => (
                        <TableRow key={row._id}>
                          <TableCell>{row.medicine_name}</TableCell>
                          <TableCell>{row.license_code}</TableCell>
                          <TableCell>{row.batch_code}</TableCell>
                          <TableCell align="right">{fmtDate(row.production_date)}</TableCell>
                          <TableCell align="right">{fmtDate(row.expiry_date)}</TableCell>
                          <TableCell align="right">
                            {(() => {
                              const m = monthsUntil(row.expiry_date);
                              return Number.isFinite(m) ? m : '—';
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar open={!!error} onClose={() => setError('')} autoHideDuration={6000} message={error} />
    </Box>
  );
};

export default RepresentativeManagerMedicinePerformance;
