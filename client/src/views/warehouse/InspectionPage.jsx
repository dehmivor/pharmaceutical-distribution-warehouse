'use client';

import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Card,
  CardContent,
  IconButton,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

function InspectionPage() {
  const [inspectionData, setInspectionData] = useState({
    inspectionId: '',
    date: new Date().toISOString().split('T')[0],
    inspector: '',
    location: '',
    items: [],
    notes: '',
    status: 'pending'
  });

  const [currentItem, setCurrentItem] = useState({
    name: '',
    condition: 'good',
    notes: ''
  });

  const handleAddItem = () => {
    if (currentItem.name.trim()) {
      setInspectionData((prev) => ({
        ...prev,
        items: [...prev.items, { ...currentItem, id: Date.now() }]
      }));
      setCurrentItem({ name: '', condition: 'good', notes: '' });
    }
  };

  const handleRemoveItem = (id) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu phiếu kiểm tra:', inspectionData);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      case 'damaged':
        return 'error';
      default:
        return 'default';
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'good':
        return 'Tốt';
      case 'fair':
        return 'Khá';
      case 'poor':
        return 'Kém';
      case 'damaged':
        return 'Hỏng';
      default:
        return condition;
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          PHIẾU KIỂM TRA
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Thông tin chung */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mã phiếu kiểm tra"
                value={inspectionData.inspectionId}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, inspectionId: e.target.value }))}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ngày kiểm tra"
                type="date"
                value={inspectionData.date}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, date: e.target.value }))}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Người kiểm tra"
                value={inspectionData.inspector}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, inspector: e.target.value }))}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Địa điểm"
                value={inspectionData.location}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, location: e.target.value }))}
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Thêm mục kiểm tra */}
          <Typography variant="h6" gutterBottom>
            Thêm mục kiểm tra
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tên mục kiểm tra"
                value={currentItem.name}
                onChange={(e) => setCurrentItem((prev) => ({ ...prev, name: e.target.value }))}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Tình trạng</InputLabel>
                <Select
                  value={currentItem.condition}
                  onChange={(e) => setCurrentItem((prev) => ({ ...prev, condition: e.target.value }))}
                  label="Tình trạng"
                >
                  <MenuItem value="good">Tốt</MenuItem>
                  <MenuItem value="fair">Khá</MenuItem>
                  <MenuItem value="poor">Kém</MenuItem>
                  <MenuItem value="damaged">Hỏng</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Ghi chú"
                value={currentItem.notes}
                onChange={(e) => setCurrentItem((prev) => ({ ...prev, notes: e.target.value }))}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={handleAddItem} sx={{ height: '56px' }}>
                Thêm
              </Button>
            </Grid>
          </Grid>

          {/* Danh sách mục đã thêm */}
          {inspectionData.items.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Danh sách kiểm tra
              </Typography>
              <Grid container spacing={2}>
                {inspectionData.items.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {item.name}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={2}>
                            <Chip label={getConditionText(item.condition)} color={getConditionColor(item.condition)} size="small" />
                          </Grid>

                          <Grid item xs={12} sm={4}>
                            {item.notes && (
                              <Typography variant="body2" color="text.secondary">
                                {item.notes}
                              </Typography>
                            )}
                          </Grid>

                          <Grid item xs={12} sm={2}>
                            <IconButton color="error" onClick={() => handleRemoveItem(item.id)} size="small">
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Ghi chú chung và trạng thái */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Ghi chú chung"
                multiline
                rows={4}
                value={inspectionData.notes}
                onChange={(e) => setInspectionData((prev) => ({ ...prev, notes: e.target.value }))}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={inspectionData.status}
                  onChange={(e) => setInspectionData((prev) => ({ ...prev, status: e.target.value }))}
                  label="Trạng thái"
                >
                  <MenuItem value="pending">Đang kiểm tra</MenuItem>
                  <MenuItem value="completed">Hoàn thành</MenuItem>
                  <MenuItem value="requires_action">Cần xử lý</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Nút submit */}
          <Grid container justifyContent="center">
            <Grid item>
              <Button type="submit" variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5 }}>
                Lưu phiếu kiểm tra
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}

export default InspectionPage;
