'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, TextField, Typography, Stack, MenuItem } from '@mui/material';
import axios from 'axios';

function CreateBillWithExistId() {
  const { billId } = useParams() || {};
  const router = useRouter();
  const id = billId;

  const [billData, setBillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Thêm trạng thái phiếu, loại phiếu (chi / thu), mã phiếu, ngày thanh toán
  const [formData, setFormData] = useState({
    voucher_code: '', // mã phiếu
    type: '', // loại phiếu
    status: '', // trạng thái
    payment_date: '',
    supplierOrCustomer: '',
    item: '',
    amount: 0,
    dueDate: '',
    description: ''
  });

  const [billType, setBillType] = useState('chi');

  // Hàm tính tổng tiền từ details
  const calcAmount = (details) => {
    if (!details || !Array.isArray(details)) return 0;
    return details.reduce((sum, d) => sum + d.quantity * d.unit_price, 0);
  };

  useEffect(() => {
    async function fetchBill() {
      if (!id) {
        setError('Không tìm thấy ID phiếu');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/bills/${id}`);
        if (!res.ok) throw new Error('Lỗi khi lấy dữ liệu phiếu');
        const json = await res.json();
        const data = json.data;

        if (!data) {
          setError('Không tìm thấy dữ liệu phiếu');
          setLoading(false);
          return;
        }

        setBillData(data);

        let supplierOrCustomer = '';
        if (data.type === 'IMPORT' && data.import_order_id) {
          // supplierOrCustomer = data.import_order_id.supplier_contract_id?.contract_name || 'N/A nhà cung cấp';
          setBillType('chi');
        } else if (data.type === 'EXPORT' && data.export_order_id) {
          supplierOrCustomer = data.export_order_id.contract_id?.contract_name || 'N/A khách hàng';
          setBillType('thu');
        }

        let itemList = [];
        if (data.import_order_id?.details?.length) {
          itemList = data.import_order_id.details.map((d) => d.medicine_id?.medicine_name || '');
        } else if (data.details?.length) {
          itemList = data.details.map((d) => d.medicine_lisence_code || '');
        }
        const item = itemList.filter(Boolean).join(', ');
        const amount = calcAmount(data.details);

        // payment_date để dùng cho payment_date và dueDate
        const payment_date = data.payment_date ? data.payment_date.slice(0, 10) : '';

        setFormData({
          voucher_code: data.voucher_code || '',
          type: data.type || '',
          status: data.status || '',
          payment_date,
          supplierOrCustomer,
          item,
          amount,
          dueDate: payment_date,
          description: data.description || ''
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Lỗi không xác định');
        setLoading(false);
      }
    }

    fetchBill();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  };

  if (loading) return <Typography>Đang tải dữ liệu phiếu...</Typography>;
  if (error) return <Typography color="error">Lỗi: {error}</Typography>;
  if (!billData) return <Typography>Không có dữ liệu phiếu</Typography>;

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 600,
        mx: 'auto',
        mt: 4,
        backgroundColor: '#fafafa',
        borderRadius: 2,
        boxShadow: 1
      }}
    >
      <Typography variant="h5" mb={3}>
        Tạo phiếu {billType === 'chi' ? 'chi' : 'thu'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField label="Mã phiếu" name="voucher_code" value={formData.voucher_code} onChange={handleChange} fullWidth disabled />

          <TextField label="Loại phiếu" name="type" value={formData.type} fullWidth disabled />

          <TextField label="Trạng thái" name="status" value={formData.status} fullWidth disabled />

          <TextField
            label={billType === 'chi' ? 'Nhà cung cấp' : 'Khách hàng'}
            name="supplierOrCustomer"
            value={formData.supplierOrCustomer}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField label="Mặt hàng" name="item" value={formData.item} onChange={handleChange} required fullWidth />

          <TextField
            type="number"
            label="Số tiền (VNĐ)"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            required
            inputProps={{ min: 0 }}
            fullWidth
          />

          <TextField
            type="date"
            label="Ngày đến hạn"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />

          <TextField label="Mô tả" name="description" value={formData.description} multiline rows={3} onChange={handleChange} fullWidth />

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button variant="contained" type="submit">
              Lưu
            </Button>
            <Button variant="outlined" onClick={handleCancel}>
              Hủy
            </Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  );
}

export default CreateBillWithExistId;
