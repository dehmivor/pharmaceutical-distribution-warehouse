'use client';
import React, { useState, useEffect } from 'react';
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
  // Static data
  const staticDrugs = [
    {
      _id: '1',
      code: 'PAR001',
      name: 'Paracetamol 500mg',
      quantity: 150,
      unit: 'viên',
      price_import: 500,
      price_sell: 800,
      minStock: 50
    },
    {
      _id: '2',
      code: 'AMO002',
      name: 'Amoxicillin 250mg',
      quantity: 75,
      unit: 'viên',
      price_import: 1200,
      price_sell: 2000,
      minStock: 100
    },
    {
      _id: '3',
      code: 'VIT003',
      name: 'Vitamin C 1000mg',
      quantity: 200,
      unit: 'viên',
      price_import: 300,
      price_sell: 500,
      minStock: 80
    },
    {
      _id: '4',
      code: 'ASP004',
      name: 'Aspirin 100mg',
      quantity: 25,
      unit: 'viên',
      price_import: 400,
      price_sell: 700,
      minStock: 50
    },
    {
      _id: '5',
      code: 'IBU005',
      name: 'Ibuprofen 400mg',
      quantity: 0,
      unit: 'viên',
      price_import: 800,
      price_sell: 1300,
      minStock: 60
    }
  ];

  const staticInventoryHistory = {
    PAR001: [
      {
        created_at: '2024-01-15T10:30:00',
        action: 'import',
        quantity_change: 100,
        quantity_before: 50,
        quantity_after: 150,
        batch_number: 'PAR2024001',
        expiry_date: '2025-12-31',
        note: 'Nhập hàng từ nhà cung cấp ABC'
      },
      {
        created_at: '2024-01-10T14:20:00',
        action: 'export',
        quantity_change: -20,
        quantity_before: 70,
        quantity_after: 50,
        batch_number: null,
        expiry_date: null,
        note: 'Bán lẻ cho khách hàng'
      }
    ],
    AMO002: [
      {
        created_at: '2024-01-12T09:15:00',
        action: 'import',
        quantity_change: 75,
        quantity_before: 0,
        quantity_after: 75,
        batch_number: 'AMO2024001',
        expiry_date: '2026-06-30',
        note: 'Nhập hàng mới'
      }
    ],
    ASP004: [
      {
        created_at: '2024-01-14T16:45:00',
        action: 'export',
        quantity_change: -25,
        quantity_before: 50,
        quantity_after: 25,
        batch_number: null,
        expiry_date: null,
        note: 'Xuất cho đơn thuốc'
      },
      {
        created_at: '2024-01-08T11:30:00',
        action: 'adjustment',
        quantity_change: -5,
        quantity_before: 55,
        quantity_after: 50,
        batch_number: null,
        expiry_date: null,
        note: 'Điều chỉnh do kiểm kê'
      }
    ]
  };

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [drugs, setDrugs] = useState(staticDrugs);
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
    // Calculate low stock drugs
    const lowStock = drugs.filter((drug) => drug.quantity <= drug.minStock);
    setLowStockDrugs(lowStock);
  }, [drugs]);

  // Function to check drug stock
  const checkDrugStock = () => {
    if (!searchDrugCode) {
      showSnackbar('Vui lòng nhập mã thuốc', 'warning');
      return;
    }

    const drug = drugs.find((d) => d.code.toLowerCase() === searchDrugCode.toLowerCase());
    if (drug) {
      setStockInfo(drug);
    } else {
      showSnackbar('Không tìm thấy thông tin thuốc', 'error');
      setStockInfo(null);
    }
  };

  // Function to show inventory history
  const showInventoryHistory = (drugCode) => {
    const history = staticInventoryHistory[drugCode] || [];
    setHistoryDialog({
      open: true,
      drugCode: drugCode,
      data: history
    });
  };

  // Function to handle import stock operation
  const handleImportStock = () => {
    if (!selectedDrug || !quantity) {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng', 'warning');
      return;
    }

    // Update drug quantity
    const updatedDrugs = drugs.map((drug) => {
      if (drug.code === selectedDrug) {
        return {
          ...drug,
          quantity: drug.quantity + parseInt(quantity)
        };
      }
      return drug;
    });

    setDrugs(updatedDrugs);
    showSnackbar('Nhập kho thành công', 'success');

    // Reset form
    setSelectedDrug('');
    setQuantity('');
    setBatchNumber('');
    setExpiryDate('');
    setImportPrice('');
    setReason('');

    // Update stock info if currently viewing this drug
    if (searchDrugCode === selectedDrug) {
      const updatedDrug = updatedDrugs.find((d) => d.code === selectedDrug);
      setStockInfo(updatedDrug);
    }
  };

  // Function to handle export stock operation
  const handleExportStock = () => {
    if (!selectedDrug || !quantity) {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng', 'warning');
      return;
    }

    // Check if enough stock
    const drug = drugs.find((d) => d.code === selectedDrug);
    if (drug.quantity < parseInt(quantity)) {
      showSnackbar('Số lượng xuất vượt quá số lượng tồn kho', 'error');
      return;
    }

    // Update drug quantity
    const updatedDrugs = drugs.map((drug) => {
      if (drug.code === selectedDrug) {
        return {
          ...drug,
          quantity: drug.quantity - parseInt(quantity)
        };
      }
      return drug;
    });

    setDrugs(updatedDrugs);
    showSnackbar('Xuất kho thành công', 'success');

    // Reset form
    setSelectedDrug('');
    setQuantity('');
    setReason('');

    // Update stock info if currently viewing this drug
    if (searchDrugCode === selectedDrug) {
      const updatedDrug = updatedDrugs.find((d) => d.code === selectedDrug);
      setStockInfo(updatedDrug);
    }
  };

  // Function to handle adjust stock operation
  const handleAdjustStock = () => {
    if (!selectedDrug || actualQuantity === '') {
      showSnackbar('Vui lòng chọn thuốc và nhập số lượng thực tế', 'warning');
      return;
    }

    // Update drug quantity
    const updatedDrugs = drugs.map((drug) => {
      if (drug.code === selectedDrug) {
        return {
          ...drug,
          quantity: parseInt(actualQuantity)
        };
      }
      return drug;
    });

    setDrugs(updatedDrugs);
    showSnackbar('Điều chỉnh số lượng thành công', 'success');

    // Reset form
    setSelectedDrug('');
    setActualQuantity('');
    setReason('');

    // Update stock info if currently viewing this drug
    if (searchDrugCode === selectedDrug) {
      const updatedDrug = updatedDrugs.find((d) => d.code === selectedDrug);
      setStockInfo(updatedDrug);
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
                  <InputLabel>Chọn Thuốc</InputLabel>
                  <Select value={selectedDrug} label="Chọn Thuốc" onChange={(e) => setSelectedDrug(e.target.value)}>
                    {drugs?.map((drug) => (
                      <MenuItem key={drug._id} value={drug.code}>
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
