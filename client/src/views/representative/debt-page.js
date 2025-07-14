'use client'
import React, { useState, useMemo } from 'react';
import {
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';

function DebtPage() {
  const router = useRouter();
  // Dữ liệu công nợ nhập
  const [debtIn] = useState([
    { id: 1, supplier: 'Nhà cung cấp A', amount: 1000000, dueDate: '2025-07-20', item: 'Mặt hàng 1', description: 'Công nợ nhập tháng 7' },
    { id: 2, supplier: 'Nhà cung cấp B', amount: 2000000, dueDate: '2025-04-15', item: 'Mặt hàng 2', description: 'Công nợ nhập tháng 4' },
    { id: 3, supplier: 'Nhà cung cấp A', amount: 1500000, dueDate: '2025-01-10', item: 'Mặt hàng 3', description: 'Công nợ nhập tháng 1' },
  ]);

  // Dữ liệu công nợ xuất
  const [debtOut] = useState([
    { id: 1, customer: 'Khách hàng X', amount: 1500000, dueDate: '2025-07-22', item: 'Mặt hàng 1', description: 'Công nợ xuất tháng 7' },
    { id: 2, customer: 'Khách hàng Y', amount: 2500000, dueDate: '2025-10-28', item: 'Mặt hàng 2', description: 'Công nợ xuất tháng 10' },
    { id: 3, customer: 'Khách hàng X', amount: 1800000, dueDate: '2025-02-15', item: 'Mặt hàng 3', description: 'Công nợ xuất tháng 2' },
  ]);

  // Tab hiện tại
  const [tab, setTab] = useState(0);

  // Bộ lọc công nợ nhập
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterQuarterIn, setFilterQuarterIn] = useState('');
  const [filterItemIn, setFilterItemIn] = useState('');

  // Bộ lọc công nợ xuất
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterQuarterOut, setFilterQuarterOut] = useState('');
  const [filterItemOut, setFilterItemOut] = useState('');

  // Modal chi tiết
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);

  // Hàm lấy quý từ tháng
  const getQuarter = (dateStr) => {
    const month = new Date(dateStr).getMonth() + 1;
    if (month >= 1 && month <= 3) return 'Quý 1';
    if (month >= 4 && month <= 6) return 'Quý 2';
    if (month >= 7 && month <= 9) return 'Quý 3';
    return 'Quý 4';
  };

  // Lọc công nợ nhập
  const filteredDebtIn = useMemo(() => {
    return debtIn.filter(d =>
      (!filterSupplier || d.supplier === filterSupplier) &&
      (!filterQuarterIn || getQuarter(d.dueDate) === filterQuarterIn) &&
      (!filterItemIn || d.item === filterItemIn)
    );
  }, [debtIn, filterSupplier, filterQuarterIn, filterItemIn]);

  // Lọc công nợ xuất
  const filteredDebtOut = useMemo(() => {
    return debtOut.filter(d =>
      (!filterCustomer || d.customer === filterCustomer) &&
      (!filterQuarterOut || getQuarter(d.dueDate) === filterQuarterOut) &&
      (!filterItemOut || d.item === filterItemOut)
    );
  }, [debtOut, filterCustomer, filterQuarterOut, filterItemOut]);

  // Options bộ lọc
  const suppliers = [...new Set(debtIn.map(d => d.supplier))];
  const customers = [...new Set(debtOut.map(d => d.customer))];
  const quarters = ['Quý 1', 'Quý 2', 'Quý 3', 'Quý 4'];
  const itemsIn = [...new Set(debtIn.map(d => d.item))];
  const itemsOut = [...new Set(debtOut.map(d => d.item))];

  // Xử lý mở modal chi tiết
  const handleOpenDetail = (data) => {
    setDetailData(data);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailData(null);
  };

  // Xử lý tạo phiếu thu/chi (demo)
  const handleCreateVoucher = (type, data) => {
  router.push(`/rp-create-bills/${data.id}`);
};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Quản lý công nợ</Typography>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mb: 3 }}>
        <Tab label="Công nợ nhập" />
        <Tab label="Công nợ xuất" />
      </Tabs>

      {tab === 0 && (
        <>
          {/* Bộ lọc công nợ nhập */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Nhà cung cấp</InputLabel>
              <Select value={filterSupplier} label="Nhà cung cấp" onChange={e => setFilterSupplier(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {suppliers.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Quý</InputLabel>
              <Select value={filterQuarterIn} label="Quý" onChange={e => setFilterQuarterIn(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {quarters.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Mặt hàng</InputLabel>
              <Select value={filterItemIn} label="Mặt hàng" onChange={e => setFilterItemIn(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {itemsIn.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Bảng công nợ nhập */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nhà cung cấp</TableCell>
                  <TableCell>Mặt hàng</TableCell>
                  <TableCell align="right">Số tiền (VNĐ)</TableCell>
                  <TableCell>Ngày đến hạn</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDebtIn.length > 0 ? filteredDebtIn.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{row.item}</TableCell>
                    <TableCell align="right">{row.amount.toLocaleString()}</TableCell>
                    <TableCell>{row.dueDate}</TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" color="primary" sx={{ mr: 1 }}
                        onClick={() => handleCreateVoucher('in', row)}>Tạo phiếu chi</Button>
                      <Button size="small" variant="outlined" onClick={() => handleOpenDetail(row)}>Xem chi tiết</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">Không có dữ liệu phù hợp</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {tab === 1 && (
        <>
          {/* Bộ lọc công nợ xuất */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Khách hàng</InputLabel>
              <Select value={filterCustomer} label="Khách hàng" onChange={e => setFilterCustomer(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {customers.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Quý</InputLabel>
              <Select value={filterQuarterOut} label="Quý" onChange={e => setFilterQuarterOut(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {quarters.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 160 }}>
              <InputLabel>Mặt hàng</InputLabel>
              <Select value={filterItemOut} label="Mặt hàng" onChange={e => setFilterItemOut(e.target.value)}>
                <MenuItem value="">Tất cả</MenuItem>
                {itemsOut.map(i => <MenuItem key={i} value={i}>{i}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

          {/* Bảng công nợ xuất */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Khách hàng</TableCell>
                  <TableCell>Mặt hàng</TableCell>
                  <TableCell align="right">Số tiền (VNĐ)</TableCell>
                  <TableCell>Ngày đến hạn</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDebtOut.length > 0 ? filteredDebtOut.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.customer}</TableCell>
                    <TableCell>{row.item}</TableCell>
                    <TableCell align="right">{row.amount.toLocaleString()}</TableCell>
                    <TableCell>{row.dueDate}</TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" color="primary" sx={{ mr: 1 }}
                        onClick={() => handleCreateVoucher('out', row)}>Tạo phiếu thu</Button>
                      <Button size="small" variant="outlined" onClick={() => handleOpenDetail(row)}>Xem chi tiết</Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">Không có dữ liệu phù hợp</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Modal chi tiết */}
      <Dialog open={openDetail} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết công nợ</DialogTitle>
        <DialogContent dividers>
          {detailData && (
            <>
              <Typography><strong>{detailData.supplier ? 'Nhà cung cấp' : 'Khách hàng'}:</strong> {detailData.supplier || detailData.customer}</Typography>
              <Typography><strong>Mặt hàng:</strong> {detailData.item}</Typography>
              <Typography><strong>Số tiền:</strong> {detailData.amount.toLocaleString()} VNĐ</Typography>
              <Typography><strong>Ngày đến hạn:</strong> {detailData.dueDate}</Typography>
              <Typography><strong>Mô tả:</strong> {detailData.description}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DebtPage;
