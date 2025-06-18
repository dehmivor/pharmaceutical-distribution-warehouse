'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Box, Alert, Chip } from '@mui/material';

function UnitConversion({ item, onConversionChange }) {
  const [conversion, setConversion] = useState({
    fromUnit: item.receivedUnit || '',
    toUnit: item.storageUnit || '',
    fromQuantity: item.actualQuantity || 0, // Lấy từ bước kiểm kê
    toQuantity: 0,
    conversionRate: 1
  });

  // Conversion rates table - có thể lấy từ database
  const conversionRates = {
    'kg-g': 1000,
    'g-kg': 0.001,
    'thùng-chai': 24,
    'chai-thùng': 1 / 24,
    'bao-kg': 50,
    'kg-bao': 1 / 50,
    'lít-ml': 1000,
    'ml-lít': 0.001,
    'bao-g': 50000, // 1 bao = 50kg = 50000g
    'g-bao': 0.00002,
    'thùng-lít': 24, // Giả sử 1 thùng = 24 lít
    'lít-thùng': 1 / 24
  };

  const units = ['kg', 'g', 'thùng', 'chai', 'bao', 'lít', 'ml'];

  const calculateConversion = (fromUnit, toUnit, fromQty) => {
    if (fromUnit === toUnit) return fromQty;

    const key = `${fromUnit}-${toUnit}`;
    const rate = conversionRates[key] || 1;
    return Math.round((parseFloat(fromQty) || 0) * rate * 100) / 100; // Làm tròn 2 chữ số thập phân
  };

  // Tự động tính toán khi component được mount hoặc khi actualQuantity thay đổi
  useEffect(() => {
    const newToQuantity = calculateConversion(conversion.fromUnit, conversion.toUnit, item.actualQuantity || 0);

    const updated = {
      ...conversion,
      fromQuantity: item.actualQuantity || 0,
      toQuantity: newToQuantity,
      conversionRate: conversionRates[`${conversion.fromUnit}-${conversion.toUnit}`] || 1
    };

    setConversion(updated);
    onConversionChange && onConversionChange(updated);
  }, [item.actualQuantity]);

  const handleFromUnitChange = (unit) => {
    const newToQuantity = calculateConversion(unit, conversion.toUnit, conversion.fromQuantity);
    const newRate = conversionRates[`${unit}-${conversion.toUnit}`] || 1;

    const updated = {
      ...conversion,
      fromUnit: unit,
      toQuantity: newToQuantity,
      conversionRate: newRate
    };

    setConversion(updated);
    onConversionChange && onConversionChange(updated);
  };

  const handleToUnitChange = (unit) => {
    const newToQuantity = calculateConversion(conversion.fromUnit, unit, conversion.fromQuantity);
    const newRate = conversionRates[`${conversion.fromUnit}-${unit}`] || 1;

    const updated = {
      ...conversion,
      toUnit: unit,
      toQuantity: newToQuantity,
      conversionRate: newRate
    };

    setConversion(updated);
    onConversionChange && onConversionChange(updated);
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quy Đổi Đơn Vị - {item.name}
        </Typography>

        {/* Hiển thị thông tin từ kiểm kê */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Thông tin từ bước kiểm kê:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Số lượng dự kiến:</strong> {item.expectedQuantity} {item.unit}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Số lượng thực tế:</strong> {item.actualQuantity} {item.unit}
              </Typography>
            </Grid>
          </Grid>

          {item.status && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={
                  item.status === 'match'
                    ? 'Đúng số lượng'
                    : item.status === 'shortage'
                      ? 'Thiếu hàng'
                      : item.status === 'excess'
                        ? 'Thừa hàng'
                        : 'Chưa kiểm'
                }
                color={
                  item.status === 'match'
                    ? 'success'
                    : item.status === 'shortage'
                      ? 'error'
                      : item.status === 'excess'
                        ? 'warning'
                        : 'default'
                }
                size="small"
              />
            </Box>
          )}
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Đơn vị nhận (từ nhà cung cấp)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Số lượng thực tế"
                  type="number"
                  value={conversion.fromQuantity}
                  InputProps={{
                    readOnly: true,
                    style: { backgroundColor: '#f5f5f5' }
                  }}
                  helperText="Tự động từ bước kiểm kê"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Đơn vị nhận</InputLabel>
                  <Select value={conversion.fromUnit} onChange={(e) => handleFromUnitChange(e.target.value)} label="Đơn vị nhận">
                    {units.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Đơn vị lưu kho
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Số lượng lưu kho"
                  type="number"
                  value={conversion.toQuantity}
                  InputProps={{
                    readOnly: true,
                    style: { backgroundColor: '#e8f5e8' }
                  }}
                  helperText="Tự động tính toán"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Đơn vị lưu kho</InputLabel>
                  <Select value={conversion.toUnit} onChange={(e) => handleToUnitChange(e.target.value)} label="Đơn vị lưu kho">
                    {units.map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Hiển thị tỷ lệ quy đổi */}
        {conversion.fromUnit && conversion.toUnit && conversion.fromUnit !== conversion.toUnit && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tỷ lệ quy đổi:</strong> 1 {conversion.fromUnit} = {conversion.conversionRate} {conversion.toUnit}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Kết quả:</strong> {conversion.fromQuantity} {conversion.fromUnit} = {conversion.toQuantity} {conversion.toUnit}
            </Typography>
          </Alert>
        )}

        {/* Cảnh báo nếu không có tỷ lệ quy đổi */}
        {conversion.fromUnit &&
          conversion.toUnit &&
          conversion.fromUnit !== conversion.toUnit &&
          !conversionRates[`${conversion.fromUnit}-${conversion.toUnit}`] && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Không tìm thấy tỷ lệ quy đổi cho {conversion.fromUnit} → {conversion.toUnit}. Vui lòng liên hệ quản trị viên để cập nhật bảng
              quy đổi.
            </Alert>
          )}
      </CardContent>
    </Card>
  );
}

export default UnitConversion;
