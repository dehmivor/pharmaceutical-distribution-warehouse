import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { format } from 'date-fns';

export default function PaymentVoucherForm({ orderData, onSubmit }) {
  // Lấy id import hoặc export order từ orderData
  const importOrderId = orderData._id || orderData.import_order_id || null;
  const exportOrderId = orderData.export_order_id || null;

  const [formData, setFormData] = useState({
    voucher_code: '',
    payment_date: format(new Date(), 'yyyy-MM-dd'), // Mặc định ngày hiện tại
    status: 'PENDING',
    amountOwed: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.voucher_code.trim()) {
      newErrors.voucher_code = 'Mã phiếu là bắt buộc';
    }
    if (!formData.payment_date) {
      newErrors.payment_date = 'Ngày thanh toán là bắt buộc';
    }
    if (!formData.amountOwed || Number(formData.amountOwed) <= 0) {
      newErrors.amountOwed = 'Số tiền công nợ phải lớn hơn 0';
    }

    setErrors(newErrors);

    // Trả về true nếu không có lỗi
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    // Tạo mảng details từ orderData.items
    const detailsFromOrder = (orderData.items || []).map((item) => ({
      medicine_lisence_code: item.productCode || '',
      quantity: item.orderedQuantity || 0,
      unit_price: item.unitPrice || 0
    }));

    // Detail phần công nợ thanh toán
    const debtDetail = {
      medicine_lisence_code: 'DEBT',
      quantity: 1,
      unit_price: Number(formData.amountOwed)
    };

    const billData = {
      type: 'PAYMENT_VOUCHER',
      voucher_code: formData.voucher_code.trim(),
      payment_date: new Date(formData.payment_date),
      status: formData.status,
      details: [...detailsFromOrder, debtDetail]
    };

    // Gán import_order_id hoặc export_order_id nếu có
    if (importOrderId) billData.import_order_id = importOrderId;
    else if (exportOrderId) billData.export_order_id = exportOrderId;

    if (formData.description.trim()) {
      billData.description = formData.description.trim();
    }

    onSubmit(billData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }} noValidate>
      <Typography variant="h6" gutterBottom>
        Tạo Phiếu Thanh Toán Công Nợ
      </Typography>

      <TextField
        label="Mã phiếu"
        name="voucher_code"
        value={formData.voucher_code}
        onChange={handleChange}
        error={!!errors.voucher_code}
        helperText={errors.voucher_code}
        required
      />

      <TextField
        label="Ngày thanh toán"
        name="payment_date"
        type="date"
        value={formData.payment_date}
        onChange={handleChange}
        error={!!errors.payment_date}
        helperText={errors.payment_date}
        required
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        label="Số tiền công nợ"
        name="amountOwed"
        type="number"
        value={formData.amountOwed}
        onChange={handleChange}
        error={!!errors.amountOwed}
        helperText={errors.amountOwed}
        required
        inputProps={{ min: 0 }}
      />

      <TextField label="Mô tả (tùy chọn)" name="description" multiline rows={3} value={formData.description} onChange={handleChange} />

      <Button variant="contained" type="submit">
        Tạo phiếu thanh toán
      </Button>
    </Box>
  );
}
