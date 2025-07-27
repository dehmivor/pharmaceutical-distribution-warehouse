'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Slide,
  Tabs,
  Tab,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Medication as MedicationIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Mock data for medicines
const mockMedicines = [
  {
    id: 1,
    license_code: 'VD-001',
    medicine_name: 'Paracetamol 500mg',
    unit_of_measure: 'viên',
    category: 'Thuốc giảm đau',
    manufacturer: 'Công ty Dược phẩm A',
    current_stock: 1500,
    min_stock: 100,
    max_stock: 2000,
    unit_price: 1200,
    expiry_date: '2025-12-31',
    status: 'active'
  },
  {
    id: 2,
    license_code: 'VD-002',
    medicine_name: 'Amoxicillin 250mg',
    unit_of_measure: 'viên',
    category: 'Kháng sinh',
    manufacturer: 'Công ty Dược phẩm B',
    current_stock: 800,
    min_stock: 50,
    max_stock: 1000,
    unit_price: 2500,
    expiry_date: '2025-10-15',
    status: 'active'
  },
  {
    id: 3,
    license_code: 'VD-003',
    medicine_name: 'Vitamin C 1000mg',
    unit_of_measure: 'viên',
    category: 'Vitamin',
    manufacturer: 'Công ty Dược phẩm C',
    current_stock: 2000,
    min_stock: 200,
    max_stock: 3000,
    unit_price: 800,
    expiry_date: '2026-06-30',
    status: 'active'
  },
  {
    id: 4,
    license_code: 'VD-004',
    medicine_name: 'Ibuprofen 400mg',
    unit_of_measure: 'viên',
    category: 'Thuốc giảm đau',
    manufacturer: 'Công ty Dược phẩm D',
    current_stock: 50,
    min_stock: 100,
    max_stock: 1500,
    unit_price: 1800,
    expiry_date: '2025-08-20',
    status: 'low_stock'
  }
];

// Mock data for inventory inspections
const mockInspections = [
  {
    id: 1,
    inspection_code: 'KK-001',
    date: '2025-07-27',
    inspector: 'Nguyễn Văn A',
    warehouse: 'Kho chính',
    status: 'completed',
    total_items: 15,
    discrepancies: 2,
    notes: 'Kiểm kê định kỳ tháng 7',
    medicines: []
  },
  {
    id: 2,
    inspection_code: 'KK-002',
    date: '2025-07-25',
    inspector: 'Trần Thị B',
    warehouse: 'Kho phụ',
    status: 'in_progress',
    total_items: 8,
    discrepancies: 0,
    notes: 'Kiểm kê sau nhập hàng',
    medicines: []
  }
];

const UNIT_OPTIONS = ['viên', 'hộp', 'chai', 'gói', 'kg', 'g', 'ml', 'lít'];
const CATEGORY_OPTIONS = ['Thuốc giảm đau', 'Kháng sinh', 'Vitamin', 'Thuốc tim mạch', 'Thuốc tiêu hóa', 'Khác'];

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MedicineInventoryPage({ isVisible = true, onBackToDashboard }) {
  const [tabValue, setTabValue] = useState(0);

  // Medicines Management
  const [medicines, setMedicines] = useState(mockMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    license_code: '',
    medicine_name: '',
    unit_of_measure: 'viên',
    category: '',
    manufacturer: '',
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit_price: 0,
    expiry_date: '',
    status: 'active'
  });
  const [editingMedicineId, setEditingMedicineId] = useState(null);

  // Inspection Management
  const [inspections, setInspections] = useState(mockInspections);
  const [openInspectionDialog, setOpenInspectionDialog] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    inspection_code: `KK-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    inspector: '',
    warehouse: 'Kho chính',
    notes: '',
    medicines: []
  });
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [editingInspectionId, setEditingInspectionId] = useState(null);
  const [inspectionMedicineSearchTerm, setInspectionMedicineSearchTerm] = useState('');

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Medicine filtering for listing
  const filteredMedicines = useMemo(() => {
    return medicines.filter(
      (medicine) =>
        medicine.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.license_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  // Medicine filtering for inspection dialog (search independent)
  const filteredMedicinesForInspection = useMemo(() => {
    return medicines.filter(
      (medicine) =>
        medicine.medicine_name.toLowerCase().includes(inspectionMedicineSearchTerm.toLowerCase()) ||
        medicine.license_code.toLowerCase().includes(inspectionMedicineSearchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(inspectionMedicineSearchTerm.toLowerCase())
    );
  }, [medicines, inspectionMedicineSearchTerm]);

  // Stock Status helper
  const getStockStatus = (medicine) => {
    if (medicine.current_stock <= medicine.min_stock) {
      return { color: 'error', text: 'Hết hàng', icon: <WarningIcon /> };
    } else if (medicine.current_stock <= medicine.min_stock * 1.2) {
      return { color: 'warning', text: 'Sắp hết', icon: <InfoIcon /> };
    }
    return { color: 'success', text: 'Đủ hàng', icon: <CheckCircleIcon /> };
  };

  // Inspection Status helpers
  const getInspectionStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getInspectionStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'in_progress':
        return 'Đang thực hiện';
      case 'pending':
        return 'Chờ thực hiện';
      default:
        return 'Không xác định';
    }
  };

  // Open Medicine Dialog for editing
  const handleOpenMedicineDialogForEdit = (medicine) => {
    setMedicineForm({ ...medicine });
    setEditingMedicineId(medicine.id);
    setOpenMedicineDialog(true);
  };

  // Delete medicine
  const handleDeleteMedicine = (id) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    setSnackbar({ open: true, message: 'Xóa thuốc thành công!', severity: 'success' });
  };

  // Create or Edit medicine handler
  const handleCreateMedicine = useCallback(() => {
    // Validate required fields
    if (!medicineForm.medicine_name || !medicineForm.license_code) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ thông tin bắt buộc', severity: 'error' });
      return;
    }

    // Determine status
    const current_stock = parseInt(medicineForm.current_stock) || 0;
    const min_stock = parseInt(medicineForm.min_stock) || 0;
    let status = 'active';
    if (current_stock <= min_stock) {
      status = 'low_stock';
    }

    const medicineData = {
      ...medicineForm,
      current_stock,
      min_stock,
      max_stock: parseInt(medicineForm.max_stock) || 0,
      unit_price: parseFloat(medicineForm.unit_price) || 0,
      status
    };

    if (editingMedicineId !== null) {
      // Update existing
      setMedicines((prev) => prev.map((med) => (med.id === editingMedicineId ? { ...medicineData, id: editingMedicineId } : med)));
      setSnackbar({ open: true, message: 'Cập nhật thuốc thành công!', severity: 'success' });
    } else {
      // Add new
      setMedicines((prev) => [...prev, { ...medicineData, id: Date.now() }]);
      setSnackbar({ open: true, message: 'Tạo thuốc mới thành công!', severity: 'success' });
    }

    // Reset form and states
    setOpenMedicineDialog(false);
    setMedicineForm({
      license_code: '',
      medicine_name: '',
      unit_of_measure: 'viên',
      category: '',
      manufacturer: '',
      current_stock: 0,
      min_stock: 0,
      max_stock: 0,
      unit_price: 0,
      expiry_date: '',
      status: 'active'
    });
    setEditingMedicineId(null);
  }, [medicineForm, editingMedicineId]);

  // Open Inspection Dialog for editing
  const handleOpenInspectionDialogForEdit = (inspection) => {
    setInspectionForm({
      inspection_code: inspection.inspection_code,
      date: inspection.date,
      inspector: inspection.inspector,
      warehouse: inspection.warehouse,
      notes: inspection.notes,
      medicines: inspection.medicines || []
    });
    setSelectedMedicines(inspection.medicines || []);
    setEditingInspectionId(inspection.id);
    setInspectionMedicineSearchTerm('');
    setOpenInspectionDialog(true);
  };

  // Delete inspection
  const handleDeleteInspection = (id) => {
    setInspections((prev) => prev.filter((i) => i.id !== id));
    setSnackbar({ open: true, message: 'Xóa phiếu kiểm kê thành công!', severity: 'success' });
  };

  // Create or Edit inspection handler
  const handleCreateInspection = useCallback(() => {
    if (!inspectionForm.inspector || selectedMedicines.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng điền đầy đủ thông tin và chọn thuốc cần kiểm kê', severity: 'error' });
      return;
    }

    const newInspectionData = {
      ...inspectionForm,
      status: 'in_progress',
      total_items: selectedMedicines.length,
      discrepancies: 0,
      medicines: selectedMedicines
    };

    if (editingInspectionId !== null) {
      setInspections((prev) => prev.map((i) => (i.id === editingInspectionId ? { ...newInspectionData, id: editingInspectionId } : i)));
      setSnackbar({ open: true, message: 'Cập nhật phiếu kiểm kê thành công!', severity: 'success' });
    } else {
      setInspections((prev) => [...prev, { ...newInspectionData, id: Date.now() }]);
      setSnackbar({ open: true, message: 'Tạo phiếu kiểm kê thành công!', severity: 'success' });
    }

    setOpenInspectionDialog(false);
    setInspectionForm({
      inspection_code: `KK-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      inspector: '',
      warehouse: 'Kho chính',
      notes: '',
      medicines: []
    });
    setSelectedMedicines([]);
    setEditingInspectionId(null);
    setInspectionMedicineSearchTerm('');
  }, [inspectionForm, selectedMedicines, editingInspectionId]);

  const handleMedicineSelection = (medicine, isSelected) => {
    if (isSelected) {
      setSelectedMedicines((prev) => [...prev, medicine]);
    } else {
      setSelectedMedicines((prev) => prev.filter((m) => m.id !== medicine.id));
    }
  };

  // Open inspection dialog with reset search for medicines
  const openInspectionDialogWithReset = () => {
    setInspectionMedicineSearchTerm('');
    setOpenInspectionDialog(true);
  };

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1">
              Quản Lý Thuốc & Kiểm Kê
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tạo thuốc mới và thực hiện kiểm kê kho
            </Typography>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Danh Sách Thuốc" icon={<MedicationIcon />} iconPosition="start" />
            <Tab label="Phiếu Kiểm Kê" icon={<InventoryIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Medicine Management Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Search and Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                    <TextField
                      placeholder="Tìm kiếm thuốc..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                      sx={{ minWidth: 300 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setMedicineForm({
                          license_code: '',
                          medicine_name: '',
                          unit_of_measure: 'viên',
                          category: '',
                          manufacturer: '',
                          current_stock: 0,
                          min_stock: 0,
                          max_stock: 0,
                          unit_price: 0,
                          expiry_date: '',
                          status: 'active'
                        });
                        setEditingMedicineId(null);
                        setOpenMedicineDialog(true);
                      }}
                    >
                      Thêm Thuốc Mới
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Medicine List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Danh Sách Thuốc ({filteredMedicines.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã thuốc</TableCell>
                          <TableCell>Tên thuốc</TableCell>
                          <TableCell>Danh mục</TableCell>
                          <TableCell>Đơn vị</TableCell>
                          <TableCell>Tồn kho</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Giá</TableCell>
                          <TableCell>Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMedicines.map((medicine) => {
                          const stockStatus = getStockStatus(medicine);
                          return (
                            <TableRow key={medicine.id}>
                              <TableCell>{medicine.license_code}</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {medicine.medicine_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {medicine.manufacturer}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{medicine.category}</TableCell>
                              <TableCell>{medicine.unit_of_measure}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{medicine.current_stock.toLocaleString()}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Min: {medicine.min_stock} | Max: {medicine.max_stock}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={stockStatus.text} color={stockStatus.color} size="small" icon={stockStatus.icon} />
                              </TableCell>
                              <TableCell>{medicine.unit_price.toLocaleString()} VND</TableCell>
                              <TableCell>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenMedicineDialogForEdit(medicine)}
                                  title="Sửa thuốc"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDeleteMedicine(medicine.id)} title="Xóa thuốc">
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Inspection Management Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Actions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Phiếu Kiểm Kê Kho</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openInspectionDialogWithReset}>
                      Tạo Phiếu Kiểm Kê
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Inspection List */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Danh Sách Phiếu Kiểm Kê ({inspections.length})
                  </Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Mã phiếu</TableCell>
                          <TableCell>Ngày kiểm kê</TableCell>
                          <TableCell>Người kiểm kê</TableCell>
                          <TableCell>Kho</TableCell>
                          <TableCell>Số mặt hàng</TableCell>
                          <TableCell>Sai lệch</TableCell>
                          <TableCell>Trạng thái</TableCell>
                          <TableCell>Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inspections.map((inspection) => (
                          <TableRow key={inspection.id}>
                            <TableCell>{inspection.inspection_code}</TableCell>
                            <TableCell>{inspection.date}</TableCell>
                            <TableCell>{inspection.inspector}</TableCell>
                            <TableCell>{inspection.warehouse}</TableCell>
                            <TableCell>{inspection.total_items}</TableCell>
                            <TableCell>
                              {inspection.discrepancies > 0 ? (
                                <Chip label={inspection.discrepancies} color="warning" size="small" />
                              ) : (
                                <Chip label="0" color="success" size="small" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getInspectionStatusText(inspection.status)}
                                color={getInspectionStatusColor(inspection.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenInspectionDialogForEdit(inspection)}
                                title="Sửa phiếu kiểm kê"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteInspection(inspection.id)}
                                title="Xóa phiếu kiểm kê"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Medicine Creation/Edit Dialog */}
        <Dialog open={openMedicineDialog} onClose={() => setOpenMedicineDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <MedicationIcon />
              {editingMedicineId === null ? 'Thêm Thuốc Mới' : 'Cập Nhật Thuốc'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mã thuốc *"
                  value={medicineForm.license_code}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, license_code: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tên thuốc *"
                  value={medicineForm.medicine_name}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, medicine_name: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Đơn vị tính</InputLabel>
                  <Select
                    value={medicineForm.unit_of_measure}
                    onChange={(e) => setMedicineForm((prev) => ({ ...prev, unit_of_measure: e.target.value }))}
                    label="Đơn vị tính"
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    value={medicineForm.category}
                    onChange={(e) => setMedicineForm((prev) => ({ ...prev, category: e.target.value }))}
                    label="Danh mục"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nhà sản xuất"
                  value={medicineForm.manufacturer}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tồn kho hiện tại"
                  type="number"
                  value={medicineForm.current_stock}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, current_stock: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tồn kho tối thiểu"
                  type="number"
                  value={medicineForm.min_stock}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, min_stock: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Tồn kho tối đa"
                  type="number"
                  value={medicineForm.max_stock}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, max_stock: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Giá (VND)"
                  type="number"
                  value={medicineForm.unit_price}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, unit_price: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ngày hết hạn"
                  type="date"
                  value={medicineForm.expiry_date}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, expiry_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMedicineDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleCreateMedicine}>
              {editingMedicineId === null ? 'Tạo Thuốc' : 'Cập Nhật'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Inspection Creation/Edit Dialog */}
        <Dialog open={openInspectionDialog} onClose={() => setOpenInspectionDialog(false)} maxWidth="lg" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon />
              {editingInspectionId === null ? 'Tạo Phiếu Kiểm Kê Mới' : 'Cập Nhật Phiếu Kiểm Kê'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Thông Tin Cơ Bản
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mã phiếu kiểm kê"
                      value={inspectionForm.inspection_code}
                      onChange={(e) => setInspectionForm((prev) => ({ ...prev, inspection_code: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ngày kiểm kê"
                      type="date"
                      value={inspectionForm.date}
                      onChange={(e) => setInspectionForm((prev) => ({ ...prev, date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Người kiểm kê *"
                      value={inspectionForm.inspector}
                      onChange={(e) => setInspectionForm((prev) => ({ ...prev, inspector: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Kho</InputLabel>
                      <Select
                        value={inspectionForm.warehouse}
                        onChange={(e) => setInspectionForm((prev) => ({ ...prev, warehouse: e.target.value }))}
                        label="Kho"
                      >
                        <MenuItem value="Kho chính">Kho chính</MenuItem>
                        <MenuItem value="Kho phụ">Kho phụ</MenuItem>
                        <MenuItem value="Kho lưu trữ">Kho lưu trữ</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ghi chú"
                      multiline
                      rows={2}
                      value={inspectionForm.notes}
                      onChange={(e) => setInspectionForm((prev) => ({ ...prev, notes: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Medicine Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Chọn Thuốc Cần Kiểm Kê
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Tìm kiếm thuốc để thêm vào phiếu kiểm kê..."
                    value={inspectionMedicineSearchTerm}
                    onChange={(e) => setInspectionMedicineSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Box>

                <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <List>
                    {filteredMedicinesForInspection.map((medicine) => {
                      const isSelected = selectedMedicines.some((m) => m.id === medicine.id);
                      const stockStatus = getStockStatus(medicine);

                      return (
                        <ListItem key={medicine.id} dense>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: stockStatus.color + '.light' }}>{stockStatus.icon}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight="medium">
                                  {medicine.medicine_name}
                                </Typography>
                                <Chip label={medicine.license_code} size="small" variant="outlined" />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {medicine.category} • {medicine.current_stock.toLocaleString()} {medicine.unit_of_measure}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  {medicine.manufacturer}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Checkbox
                              edge="end"
                              checked={isSelected}
                              onChange={(e) => handleMedicineSelection(medicine, e.target.checked)}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                      );
                    })}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInspectionDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleCreateInspection}>
              {editingInspectionId === null ? 'Tạo Phiếu Kiểm Kê' : 'Cập Nhật'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={(event, reason) => {
            if (reason !== 'clickaway') {
              setSnackbar({ ...snackbar, open: false });
            }
          }}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          action={
            <Button color="inherit" size="small" onClick={() => setSnackbar({ ...snackbar, open: false })}>
              Đóng
            </Button>
          }
        />
      </Box>
    </Slide>
  );
}
