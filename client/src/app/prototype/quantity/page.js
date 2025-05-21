'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip
} from '@mui/material';

import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const InventoryManagementPage = () => {
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [drugs, setDrugs] = useState([]);
  const [lowStockDrugs, setLowStockDrugs] = useState([]);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [importPrice, setImportPrice] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [historyDialog, setHistoryDialog] = useState({ open: false, drugCode: null, data: [] });
  const [searchDrugCode, setSearchDrugCode] = useState('');
  const [stockInfo, setStockInfo] = useState(null);
  const [actualQuantity, setActualQuantity] = useState('');

  // Load initial data
  useEffect(() => {
    // Fetch drugs and low stock drugs
    fetchDrugs();
    fetchLowStockDrugs();
  }, []);

  // Function to fetch all drugs
  const fetchDrugs = async () => {
    try {
      // Replace with your actual API endpoint
      const response = await axios.get('/api/drug');
      setDrugs(response.data.data || []);
    } catch (error) {
      showSnackbar('Không thể tải danh sách thuốc', 'error');
    }
  };

  // Function to fetch low stock drugs
  const fetchLowStockDrugs = async () => {
    try {
      const response = await axios.get('/api/inventory/low-stock');
      setLowStockDrugs(response.data.data?.drugs || []);
    } catch (error) {
      showSnackbar('Không thể tải danh sách thuốc sắp hết', 'error');
    }
  };

  // Function to check drug stock
  const checkDrugStock = async () => {
    if (!searchDrugCode) {
      showSnackbar('Vui lòng nhập mã thuốc', 'warning');
      return;
    }

    try {
      const response = await axios.get(`/api/inventory/check/${searchDrugCode}`);
      setStockInfo(response.data.data);
    } catch (error) {
      showSnackbar('Không tìm thấy thông tin thuốc', 'error');
      setStockInfo(null);
    }
  };

  // Function to show inventory history
  const showInventoryHistory = async (drugCode) => {
    try {
      const response = await axios.get(`/api/inventory/history/${drugCode}`);
      setHistoryDialog({
        open: true,
        drugCode: drugCode,
        data: response.data.data?.inventory_history || []
      });
    } catch (error) {
      showSnackbar('Không thể tải lịch sử kiểm kê', 'error');
    }
  };

  // Function to handle import stock operation
  const handleImportStock = async () => {
    if (!selectedDrug || !quantity) {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng', 'warning');
      return;
    }

    try {
      await axios.post('/api/inventory/import', {
        drugCode: selectedDrug,
        quantity: parseInt(quantity),
        batchNumber,
        expiryDate: expiryDate || undefined,
        importPrice: importPrice || undefined,
        note: reason
      });

      showSnackbar('Nhập kho thành công', 'success');
      setSelectedDrug('');
      setQuantity('');
      setBatchNumber('');
      setExpiryDate('');
      setImportPrice('');
      setReason('');

      // Refresh data
      fetchDrugs();
      fetchLowStockDrugs();
      if (searchDrugCode === selectedDrug) {
        checkDrugStock();
      }
    } catch (error) {
      showSnackbar(`Lỗi khi nhập kho: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Function to handle export stock operation
  const handleExportStock = async () => {
    if (!selectedDrug || !quantity) {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng', 'warning');
      return;
    }

    try {
      await axios.post('/api/inventory/export', {
        drugCode: selectedDrug,
        quantity: parseInt(quantity),
        reason
      });

      showSnackbar('Xuất kho thành công', 'success');
      setSelectedDrug('');
      setQuantity('');
      setReason('');

      // Refresh data
      fetchDrugs();
      fetchLowStockDrugs();
      if (searchDrugCode === selectedDrug) {
        checkDrugStock();
      }
    } catch (error) {
      showSnackbar(`Lỗi khi xuất kho: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Function to handle adjust stock operation
  const handleAdjustStock = async () => {
    if (!selectedDrug || actualQuantity === '') {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng thực tế', 'warning');
      return;
    }

    try {
      await axios.post('/api/inventory/adjust', {
        drugCode: selectedDrug,
        actualQuantity: parseInt(actualQuantity),
        note: reason
      });

      showSnackbar('Điều chỉnh số lượng thành công', 'success');
      setSelectedDrug('');
      setActualQuantity('');
      setReason('');

      // Refresh data
      fetchDrugs();
      fetchLowStockDrugs();
      if (searchDrugCode === selectedDrug) {
        checkDrugStock();
      }
    } catch (error) {
      showSnackbar(`Lỗi khi điều chỉnh số lượng: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset form fields when changing tabs
    setSelectedDrug('');
    setQuantity('');
    setActualQuantity('');
    setBatchNumber('');
    setExpiryDate('');
    setImportPrice('');
    setReason('');
  };

  // Function to show snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Function to close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Function to close history dialog
  const handleCloseHistoryDialog = () => {
    setHistoryDialog({ ...historyDialog, open: false });
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to translate action
  const translateAction = (action) => {
    switch (action) {
      case 'import':
        return 'Nhập kho';
      case 'export':
        return 'Xuất kho';
      case 'adjustment':
        return 'Điều chỉnh';
      default:
        return action;
    }
  };

  // Function to get action color
  const getActionColor = (action) => {
    switch (action) {
      case 'import':
        return 'success';
      case 'export':
        return 'secondary';
      case 'adjustment':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Quản Lý Kho Thuốc
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary" variant="fullWidth">
          <Tab label="Nhập Kho" icon={<AddIcon />} iconPosition="start" />
          <Tab label="Xuất Kho" icon={<RemoveIcon />} iconPosition="start" />
          <Tab label="Điều Chỉnh" icon={<RefreshIcon />} iconPosition="start" />
          <Tab label="Kiểm Tra" icon={<SearchIcon />} iconPosition="start" />
          <Tab label="Cảnh Báo" icon={<WarningIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Tab 1: Import drugs */}
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="drug-select-label">Chọn Thuốc</InputLabel>
                  <Select
                    labelId="drug-select-label"
                    value={selectedDrug}
                    label="Chọn Thuốc"
                    onChange={(e) => setSelectedDrug(e.target.value)}
                  >
                    {drugs.map((drug) => (
                      <MenuItem key={drug.code} value={drug.code}>
                        {drug.name} ({drug.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số Lượng"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Số Lô" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Hạn Sử Dụng"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Giá Nhập"
                  type="number"
                  value={importPrice}
                  onChange={(e) => setImportPrice(e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Ghi Chú" value={reason} onChange={(e) => setReason(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleImportStock}>
                  Nhập Kho
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Export drugs */}
          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="drug-select-export-label">Chọn Thuốc</InputLabel>
                  <Select
                    labelId="drug-select-export-label"
                    value={selectedDrug}
                    label="Chọn Thuốc"
                    onChange={(e) => setSelectedDrug(e.target.value)}
                  >
                    {drugs.map((drug) => (
                      <MenuItem key={drug.code} value={drug.code}>
                        {drug.name} ({drug.code}) - SL: {drug.quantity || 0}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số Lượng"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Lý Do" value={reason} onChange={(e) => setReason(e.target.value)} multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="secondary" startIcon={<RemoveIcon />} onClick={handleExportStock}>
                  Xuất Kho
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Tab 3: Adjust inventory */}
          {tabValue === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="drug-select-adjust-label">Chọn Thuốc</InputLabel>
                  <Select
                    labelId="drug-select-adjust-label"
                    value={selectedDrug}
                    label="Chọn Thuốc"
                    onChange={(e) => setSelectedDrug(e.target.value)}
                  >
                    {drugs.map((drug) => (
                      <MenuItem key={drug.code} value={drug.code}>
                        {drug.name} ({drug.code}) - SL: {drug.quantity || 0}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số Lượng Thực Tế"
                  type="number"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Nhập số lượng thực tế đếm được khi kiểm kê"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lý Do Điều Chỉnh"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="info" startIcon={<RefreshIcon />} onClick={handleAdjustStock}>
                  Điều Chỉnh Số Lượng
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Tab 4: Check inventory */}
          {tabValue === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Nhập Mã Thuốc" value={searchDrugCode} onChange={(e) => setSearchDrugCode(e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SearchIcon />}
                  onClick={checkDrugStock}
                  sx={{ height: '56px' }}
                  fullWidth
                >
                  Kiểm Tra
                </Button>
              </Grid>

              {stockInfo && (
                <Grid item xs={12}>
                  <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Thông Tin Thuốc: {stockInfo.name}
                    </Typography>
                    <Typography>Mã thuốc: {stockInfo.code}</Typography>
                    <Typography>Số lượng hiện có: {stockInfo.quantity}</Typography>
                    <Typography>Đơn vị: {stockInfo.unit}</Typography>
                    <Typography>Giá nhập: {stockInfo.price_import?.toLocaleString('vi-VN')} VNĐ</Typography>
                    <Typography>Giá bán: {stockInfo.price_sell?.toLocaleString('vi-VN')} VNĐ</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => showInventoryHistory(stockInfo.code)}>
                        Xem Lịch Sử
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* Tab 5: Low stock warning */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Danh Sách Thuốc Sắp Hết
              </Typography>
              {lowStockDrugs.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mã Thuốc</TableCell>
                        <TableCell>Tên Thuốc</TableCell>
                        <TableCell>Số Lượng</TableCell>
                        <TableCell>Giá Nhập</TableCell>
                        <TableCell>Giá Bán</TableCell>
                        <TableCell>Trạng Thái</TableCell>
                        <TableCell>Thao Tác</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockDrugs.map((drug) => (
                        <TableRow key={drug.code}>
                          <TableCell>{drug.code}</TableCell>
                          <TableCell>{drug.name}</TableCell>
                          <TableCell>{drug.quantity}</TableCell>
                          <TableCell>{drug.price_import?.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell>{drug.price_sell?.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell>
                            <Chip
                              label={drug.quantity === 0 ? 'Hết hàng' : 'Sắp hết'}
                              color={drug.quantity === 0 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton color="primary" size="small" onClick={() => showInventoryHistory(drug.code)} title="Xem lịch sử">
                              <HistoryIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>Không có thuốc nào sắp hết</Typography>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onClose={handleCloseHistoryDialog} aria-labelledby="history-dialog-title" maxWidth="md" fullWidth>
        <DialogTitle id="history-dialog-title">
          Lịch Sử Kho - {historyDialog.drugCode}
          <IconButton aria-label="close" onClick={handleCloseHistoryDialog} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyDialog.data.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thời Gian</TableCell>
                    <TableCell>Loại Thao Tác</TableCell>
                    <TableCell>Thay Đổi</TableCell>
                    <TableCell>SL Trước</TableCell>
                    <TableCell>SL Sau</TableCell>
                    <TableCell>Số Lô</TableCell>
                    <TableCell>Hạn Dùng</TableCell>
                    <TableCell>Ghi Chú</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyDialog.data.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(record.created_at)}</TableCell>
                      <TableCell>
                        <Chip label={translateAction(record.action)} color={getActionColor(record.action)} size="small" />
                      </TableCell>
                      <TableCell>{record.quantity_change > 0 ? `+${record.quantity_change}` : record.quantity_change}</TableCell>
                      <TableCell>{record.quantity_before}</TableCell>
                      <TableCell>{record.quantity_after}</TableCell>
                      <TableCell>{record.batch_number || '-'}</TableCell>
                      <TableCell>{record.expiry_date ? formatDate(record.expiry_date).split(' ')[0] : '-'}</TableCell>
                      <TableCell>{record.note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography align="center">Không có dữ liệu lịch sử</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default InventoryManagementPage;
