'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Slide,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Autocomplete
} from '@mui/material';
import { Add as AddIcon, Medication as MedicationIcon } from '@mui/icons-material';

// Enum category và status (giống constants bạn dùng trên backend)
const MEDICINE_CATEGORY = {
  PAIN_RELEIVER: 'Thuốc giảm đau',
  ANTIBIOTIC: 'Kháng sinh',
  VITAMIN: 'Vitamin',
  CARDIO: 'Thuốc tim mạch',
  DIGESTION: 'Thuốc tiêu hóa',
  OTHER: 'Khác'
};

const MEDICINE_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOW_STOCK: 'low_stock'
};

const UNIT_OPTIONS = ['viên', 'hộp', 'chai', 'gói', 'kg', 'g', 'ml', 'lít'];

// Dữ liệu mock ban đầu cho medicines
const mockMedicines = [
  {
    id: 1,
    license_code: 'VD-001',
    medicine_name: 'Paracetamol 500mg',
    storage_conditions: {
      temperature: '2-8°C',
      humidity: '≤60%',
      light: 'Tránh ánh sáng trực tiếp',
      other: ''
    },
    category: MEDICINE_CATEGORY.PAIN_RELEIVER,
    min_stock_threshold: 100,
    max_stock_threshold: 2000,
    unit_of_measure: 'viên',
    status: MEDICINE_STATUSES.ACTIVE
  },
  {
    id: 2,
    license_code: 'VD-002',
    medicine_name: 'Amoxicillin 250mg',
    storage_conditions: {
      temperature: '15-25°C',
      humidity: '',
      light: '',
      other: ''
    },
    category: MEDICINE_CATEGORY.ANTIBIOTIC,
    min_stock_threshold: 50,
    max_stock_threshold: 1000,
    unit_of_measure: 'viên',
    status: MEDICINE_STATUSES.ACTIVE
  }
  // ... thêm thuốc mẫu nếu cần
];

// Form medicine khởi tạo
const initialMedicineForm = {
  license_code: '',
  medicine_name: '',
  storage_conditions: {
    temperature: '',
    humidity: '',
    light: '',
    other: ''
  },
  category: '',
  min_stock_threshold: 0,
  max_stock_threshold: 0,
  unit_of_measure: '',
  status: MEDICINE_STATUSES.ACTIVE
};

export default function MedicineInventoryPage({ isVisible = true }) {
  // State medicine list
  const [medicines, setMedicines] = useState(mockMedicines);
  // Thuốc được chọn cho phiếu kiểm kê
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  // Input value tìm kiếm thuốc
  const [medicineInputValue, setMedicineInputValue] = useState('');
  // Modal tạo thuốc mới
  const [openMedicineDialog, setOpenMedicineDialog] = useState(false);
  // Form thuốc mới
  const [medicineForm, setMedicineForm] = useState(initialMedicineForm);
  // Form phiếu kiểm kê
  const [inspectionForm, setInspectionForm] = useState({
    inspection_code: `KK-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    inspector: '',
    warehouse: 'Kho chính',
    notes: '',
    import_order_id: '',
    actual_quantity: 0,
    rejected_quantity: 0,
    created_by: ''
  });
  // Snackbar thông báo
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Thêm thuốc từ autocomplete
  const handleAddMedicineByAutocomplete = (medicine) => {
    if (!medicine) return;
    if (selectedMedicines.some((m) => m.id === medicine.id)) {
      setSnackbar({ open: true, message: 'Thuốc đã được chọn rồi', severity: 'warning' });
    } else {
      setSelectedMedicines((prev) => [...prev, medicine]);
      setSnackbar({ open: true, message: `Đã thêm thuốc: "${medicine.medicine_name}"`, severity: 'success' });
    }
    setMedicineInputValue('');
  };

  // Xóa thuốc khỏi danh sách kiểm kê
  const handleRemoveSelectedMedicine = (medicineId) => {
    setSelectedMedicines((prev) => prev.filter((m) => m.id !== medicineId));
  };

  // Tạo thuốc mới
  const handleCreateMedicine = useCallback(() => {
    if (
      !medicineForm.medicine_name.trim() ||
      !medicineForm.license_code.trim() ||
      !medicineForm.unit_of_measure.trim() ||
      !medicineForm.storage_conditions.temperature.trim()
    ) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc: Mã thuốc, Tên thuốc, Đơn vị tính, Điều kiện bảo quản (nhiệt độ)',
        severity: 'error'
      });
      return;
    }
    const newMedicine = {
      id: Date.now(),
      license_code: medicineForm.license_code.trim(),
      medicine_name: medicineForm.medicine_name.trim(),
      storage_conditions: {
        temperature: medicineForm.storage_conditions.temperature.trim(),
        humidity: medicineForm.storage_conditions.humidity.trim(),
        light: medicineForm.storage_conditions.light.trim(),
        other: medicineForm.storage_conditions.other.trim()
      },
      category: medicineForm.category || null,
      min_stock_threshold: medicineForm.min_stock_threshold >= 0 ? medicineForm.min_stock_threshold : 0,
      max_stock_threshold: medicineForm.max_stock_threshold >= 0 ? medicineForm.max_stock_threshold : 0,
      unit_of_measure: medicineForm.unit_of_measure.trim(),
      status: medicineForm.status
    };
    setMedicines((prev) => [...prev, newMedicine]);
    setSelectedMedicines((prev) => [...prev, newMedicine]);
    setOpenMedicineDialog(false);
    setMedicineForm(initialMedicineForm);
    setSnackbar({ open: true, message: 'Tạo thuốc mới thành công!', severity: 'success' });
  }, [medicineForm]);

  // Tạo phiếu kiểm kê (chỉ mock)
  const handleSubmitInventory = () => {
    if (!inspectionForm.inspector.trim()) {
      setSnackbar({ open: true, message: 'Vui lòng nhập người kiểm kê!', severity: 'error' });
      return;
    }
    if (selectedMedicines.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng chọn ít nhất một thuốc để kiểm kê!', severity: 'error' });
      return;
    }
    if (inspectionForm.actual_quantity < 0) {
      setSnackbar({ open: true, message: 'Số lượng thực nhận không được âm!', severity: 'error' });
      return;
    }
    if (inspectionForm.rejected_quantity < 0) {
      setSnackbar({ open: true, message: 'Số lượng bị loại không được âm!', severity: 'error' });
      return;
    }
    // TODO: Gửi dữ liệu ra API hoặc xử lý logic lưu phiếu
    setSnackbar({ open: true, message: `Tạo phiếu kiểm kê thành công với ${selectedMedicines.length} thuốc`, severity: 'success' });
    // Reset form
    setSelectedMedicines([]);
    setInspectionForm({
      inspection_code: `KK-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      inspector: '',
      warehouse: 'Kho chính',
      notes: '',
      import_order_id: '',
      actual_quantity: 0,
      rejected_quantity: 0,
      created_by: ''
    });
  };

  return (
    <Slide direction="left" in={isVisible} mountOnEnter unmountOnExit>
      <Box sx={{ p: { xs: 2, md: 3 }, mx: 'auto' }}>
        <Typography variant="h4" mb={3}>
          Tạo Phiếu Kiểm Kê Thuốc Không Tồn Tại Trong Đơn Nhập
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Sử dụng chức năng này để tạo phiếu kiểm kê cho các loại thuốc không có trong đơn nhập. Bạn có thể thêm thuốc mới hoặc chọn từ danh
          sách hiện có.
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Thông Tin Phiếu Kiểm Kê
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mã phiếu kiểm kê"
                  fullWidth
                  value={inspectionForm.inspection_code}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, inspection_code: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ngày kiểm kê"
                  type="date"
                  fullWidth
                  value={inspectionForm.date}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Người kiểm kê *"
                  fullWidth
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

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Người tạo (created_by)"
                  fullWidth
                  value={inspectionForm.created_by}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, created_by: e.target.value }))}
                  placeholder="ObjectId"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Số lượng thực nhận (actual_quantity) *"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={inspectionForm.actual_quantity}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, actual_quantity: Number(e.target.value) }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Số lượng bị loại (rejected_quantity)"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={inspectionForm.rejected_quantity}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, rejected_quantity: Number(e.target.value) }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Ghi chú"
                  multiline
                  fullWidth
                  value={inspectionForm.notes}
                  onChange={(e) => setInspectionForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Chọn Thuốc Cần Kiểm Kê
              </Typography>
              <Autocomplete
                options={medicines}
                getOptionLabel={(option) => `${option.medicine_name} (${option.license_code})`}
                value={null}
                inputValue={medicineInputValue}
                onInputChange={(event, newInputValue) => setMedicineInputValue(newInputValue)}
                onChange={(event, newValue) => {
                  if (newValue) {
                    handleAddMedicineByAutocomplete(newValue);
                  }
                }}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nhập tên thuốc hoặc mã thuốc"
                    placeholder="VD: Paracetamol 500mg"
                    helperText="Chọn thuốc hoặc nhập tên thuốc mới để tạo"
                    error={
                      medicineInputValue !== '' &&
                      !medicines.some((m) => m.medicine_name.toLowerCase() === medicineInputValue.toLowerCase())
                    }
                  />
                )}
              />
              {medicineInputValue !== '' && !medicines.some((m) => m.medicine_name.toLowerCase() === medicineInputValue.toLowerCase()) && (
                <Box mt={1}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setOpenMedicineDialog(true);
                      setMedicineForm((prev) => ({
                        ...prev,
                        medicine_name: medicineInputValue,
                        license_code: '',
                        unit_of_measure: '',
                        storage_conditions: {
                          temperature: '',
                          humidity: '',
                          light: '',
                          other: ''
                        },
                        category: '',
                        min_stock_threshold: 0,
                        max_stock_threshold: 0,
                        status: MEDICINE_STATUSES.ACTIVE
                      }));
                      setMedicineInputValue('');
                    }}
                    startIcon={<AddIcon />}
                  >
                    Thêm thuốc mới: "{medicineInputValue}"
                  </Button>
                </Box>
              )}

              <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                {selectedMedicines.length === 0 && (
                  <Typography color="text.secondary" variant="body2">
                    Chưa chọn thuốc nào
                  </Typography>
                )}
                {selectedMedicines.map((med) => (
                  <Chip
                    key={med.id}
                    label={`${med.medicine_name} (${med.license_code})`}
                    onDelete={() => handleRemoveSelectedMedicine(med.id)}
                    color="primary"
                  />
                ))}
              </Box>
            </Box>

            <Box mt={4}>
              <Button
                variant="contained"
                onClick={handleSubmitInventory}
                disabled={selectedMedicines.length === 0 || !inspectionForm.inspector.trim()}
              >
                Tạo Phiếu Kiểm Kê
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Modal tạo thuốc mới */}
        <Dialog open={openMedicineDialog} onClose={() => setOpenMedicineDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <MedicationIcon />
              Thêm Thuốc Mới
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

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Điều kiện bảo quản * (Nhiệt độ là bắt buộc)
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nhiệt độ"
                  value={medicineForm.storage_conditions.temperature}
                  onChange={(e) =>
                    setMedicineForm((prev) => ({
                      ...prev,
                      storage_conditions: { ...prev.storage_conditions, temperature: e.target.value }
                    }))
                  }
                  placeholder="VD: 2-8°C"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Độ ẩm"
                  value={medicineForm.storage_conditions.humidity}
                  onChange={(e) =>
                    setMedicineForm((prev) => ({
                      ...prev,
                      storage_conditions: { ...prev.storage_conditions, humidity: e.target.value }
                    }))
                  }
                  placeholder="VD: ≤60%"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ánh sáng"
                  value={medicineForm.storage_conditions.light}
                  onChange={(e) =>
                    setMedicineForm((prev) => ({
                      ...prev,
                      storage_conditions: { ...prev.storage_conditions, light: e.target.value }
                    }))
                  }
                  placeholder="VD: Tránh ánh sáng trực tiếp"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Khác"
                  value={medicineForm.storage_conditions.other}
                  onChange={(e) =>
                    setMedicineForm((prev) => ({
                      ...prev,
                      storage_conditions: { ...prev.storage_conditions, other: e.target.value }
                    }))
                  }
                  placeholder="Thông tin bổ sung"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Danh mục</InputLabel>
                  <Select
                    label="Danh mục"
                    placeholder="Chọn danh mục"
                    value={medicineForm.category}
                    onChange={(e) => setMedicineForm((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    {Object.values(MEDICINE_CATEGORY).map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Tồn kho tối thiểu"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={medicineForm.min_stock_threshold}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, min_stock_threshold: Number(e.target.value) }))}
                />
              </Grid>

              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Tồn kho tối đa"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={medicineForm.max_stock_threshold}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, max_stock_threshold: Number(e.target.value) }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Đơn vị tính *"
                  value={medicineForm.unit_of_measure}
                  onChange={(e) => setMedicineForm((prev) => ({ ...prev, unit_of_measure: e.target.value }))}
                  placeholder="VD: viên, hộp,…"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select
                    label="Trạng thái"
                    value={medicineForm.status}
                    onChange={(e) => setMedicineForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {Object.values(MEDICINE_STATUSES).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenMedicineDialog(false)}>Hủy</Button>
            <Button variant="contained" onClick={handleCreateMedicine}>
              Tạo Thuốc
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={(event, reason) => {
            if (reason !== 'clickaway') {
              setSnackbar((prev) => ({ ...prev, open: false }));
            }
          }}
          message={snackbar.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          action={
            <Button color="inherit" size="small" onClick={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
              Đóng
            </Button>
          }
        />
      </Box>
    </Slide>
  );
}
