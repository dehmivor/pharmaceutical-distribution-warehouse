'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  Chip,
  Button,
  TextField,
  MenuItem,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';

// Mock data
const billsMock = [
  {
    id: 'BILL001',
    type: 'Phiếu nhập',
    contract: 'HD001',
    document: 'CT001',
    dueDate: '2025-07-20',
    amount: 1000000,
    paid: false,
  },
  {
    id: 'BILL002',
    type: 'Phiếu xuất',
    contract: 'HD002',
    document: 'CT002',
    dueDate: '2025-07-25',
    amount: 2000000,
    paid: true,
  },
];

const cardColors = ['#e3f2fd', '#e8f5e9', '#fff3e0', '#fce4ec'];

// StatCard subcomponent
function StatCard({ title, value, color, chipLabel, chipColor }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        bgcolor: color,
        borderRadius: 3,
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
      <Stack direction="row" alignItems="center" spacing={1} mt={1}>
        <Typography variant="h5">{value}</Typography>
        {chipLabel && (
          <Chip label={chipLabel} color={chipColor || 'success'} size="small" />
        )}
      </Stack>
    </Paper>
  );
}

export default function BillOverview() {
  const [bills, setBills] = useState(billsMock);

  // Thống kê nhanh
  const totalAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0);
  const unpaidCount = bills.filter(b => !b.paid).length;

  // Form
  const {
    control, handleSubmit, reset, formState: { errors },
  } = useForm({
    defaultValues: {
      id: '',
      type: '',
      contract: '',
      document: '',
      dueDate: '',
      amount: '',
    },
  });

  const onSubmit = (data) => {
    const isDuplicate = bills.some(
      (b) => b.id === data.id || (b.contract === data.contract && b.document === data.document)
    );
    const isPaid = bills.some(
      (b) => b.contract === data.contract && b.document === data.document && b.paid
    );
    if (isDuplicate) {
      alert('Công nợ đã tồn tại!');
      return;
    }
    if (isPaid) {
      alert('Công nợ này đã thanh toán!');
      return;
    }
    setBills([...bills, { ...data, paid: false }]);
    reset();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, px: { xs: 1, md: 0 } }}>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Thống kê nhanh */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Tổng số hóa đơn" value={bills.length} color={cardColors[0]} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Tổng số tiền" value={totalAmount.toLocaleString()} color={cardColors[1]} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Chưa thanh toán" value={unpaidCount} color={cardColors[2]} chipLabel="Cần chú ý" chipColor="warning" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard title="Đã thanh toán" value={bills.length - unpaidCount} color={cardColors[3]} chipLabel="OK" chipColor="success" />
            </Grid>
          </Grid>
        </Grid>

        {/* Danh sách hóa đơn */}
        <Grid item xs={12}>
          <Typography variant="h6" mb={1}>
            Danh sách hóa đơn
          </Typography>
          <Grid container spacing={2}>
            {bills.map((bill) => (
              <Grid item xs={12} sm={6} md={4} key={bill.id}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: bill.paid ? '#e8f5e9' : '#fffde7',
                    borderLeft: `4px solid ${bill.paid ? '#43a047' : '#fbc02d'}`,
                    borderRadius: 2,
                    minHeight: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" color="text.secondary">Mã: {bill.id}</Typography>
                    <Typography variant="body2">Loại: {bill.type}</Typography>
                    <Typography variant="body2">Hợp đồng: {bill.contract}</Typography>
                    <Typography variant="body2">Chứng từ: {bill.document}</Typography>
                    <Typography variant="body2">
                      Đáo hạn: {bill.dueDate ? format(new Date(bill.dueDate), 'dd/MM/yyyy') : '-'}
                    </Typography>
                    <Typography variant="body2">Số tiền: {Number(bill.amount).toLocaleString()}</Typography>
                    <Chip
                      label={bill.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      color={bill.paid ? 'success' : 'warning'}
                      size="small"
                      sx={{ mt: 0.5, width: 'fit-content' }}
                    />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Thông tin khác */}
        <Grid item xs={12}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              bgcolor: '#f3e5f5',
              borderRadius: 3,
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" mb={1}>Thông tin khác</Typography>
            <Typography variant="body2" color="text.secondary">
              Bạn có thể hiển thị chi tiết hóa đơn, hướng dẫn, hoặc thông báo tại đây.
            </Typography>
          </Paper>
        </Grid>

        {/* Form tạo công nợ */}
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: '#e3f2fd', maxWidth: 900, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Tạo công nợ mới
            </Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="id"
                    control={control}
                    rules={{ required: 'Mã công nợ bắt buộc' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mã công nợ"
                        fullWidth
                        error={!!errors.id}
                        helperText={errors.id?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: 'Loại phiếu bắt buộc' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Loại phiếu"
                        fullWidth
                        error={!!errors.type}
                        helperText={errors.type?.message}
                      >
                        <MenuItem value="Phiếu nhập">Phiếu nhập</MenuItem>
                        <MenuItem value="Phiếu xuất">Phiếu xuất</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="dueDate"
                    control={control}
                    rules={{
                      required: 'Ngày đáo hạn bắt buộc',
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Ngày đáo hạn"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        error={!!errors.dueDate}
                        helperText={errors.dueDate?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="contract"
                    control={control}
                    rules={{ required: 'Hợp đồng bắt buộc' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Hợp đồng"
                        fullWidth
                        error={!!errors.contract}
                        helperText={errors.contract?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="document"
                    control={control}
                    rules={{ required: 'Chứng từ bắt buộc' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Chứng từ"
                        fullWidth
                        error={!!errors.document}
                        helperText={errors.document?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="amount"
                    control={control}
                    rules={{
                      required: 'Số tiền bắt buộc',
                      min: { value: 1, message: 'Số tiền phải lớn hơn 0' },
                      validate: value => !isNaN(Number(value)) || 'Số tiền không hợp lệ',
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Số tiền"
                        type="number"
                        fullWidth
                        error={!!errors.amount}
                        helperText={errors.amount?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 1 }}>
                    Tạo công nợ
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
