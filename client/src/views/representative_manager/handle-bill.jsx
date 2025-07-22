'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import {
  Add as AddIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HourglassEmpty as HourglassEmptyIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

const statusConfig = {
  PAID: { label: 'Đã thanh toán', color: 'success', icon: <CheckIcon fontSize="small" /> },
  PENDING: { label: 'Chờ thanh toán', color: 'warning', icon: <HourglassEmptyIcon fontSize="small" /> },
  OVERDUE: { label: 'Quá hạn', color: 'error', icon: <CancelIcon fontSize="small" /> },
  CANCELLED: { label: 'Đã hủy', color: 'default', icon: <CancelIcon fontSize="small" /> },
  DRAFT: { label: 'Nháp', color: 'info', icon: <EditIcon fontSize="small" /> },
  COMPLETED: { label: 'Hoàn thành', color: 'primary', icon: <CheckIcon fontSize="small" /> }
};

function HandleBill() {
  const [bills, setBills] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('createdDate');
  const [sortDirection, setSortDirection] = useState('desc');

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // add, edit, view
  const [selectedBill, setSelectedBill] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuBillId, setMenuBillId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    billNumber: '',
    customerName: '',
    amount: '',
    status: 'draft',
    dueDate: '',
    description: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filtered and sorted data
  const filteredAndSortedBills = useMemo(() => {
    let filtered = bills.filter((bill) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = bill.billNumber.toLowerCase().includes(term) || bill.customerName.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string comparison normalized
      if (sortField === 'customerName' || sortField === 'billNumber') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle numeric amount
      if (sortField === 'amount') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      // Dates comparison
      if (sortField === 'createdDate' || sortField === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [bills, searchTerm, statusFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedBills.length / rowsPerPage);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleOpenDialog = (mode, bill = null) => {
    setDialogMode(mode);
    setSelectedBill(bill);
    if (bill) {
      setFormData({
        billNumber: bill.billNumber,
        customerName: bill.customerName,
        amount: bill.amount.toString(),
        status: bill.status,
        dueDate: bill.dueDate,
        description: bill.description
      });
    } else {
      setFormData({
        billNumber: `INV-2024-${String(bills.length + 1).padStart(3, '0')}`,
        customerName: '',
        amount: '',
        status: 'draft',
        dueDate: '',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBill(null);
    setAnchorEl(null);
    setMenuBillId(null);
    setFormData({
      billNumber: '',
      customerName: '',
      amount: '',
      status: 'draft',
      dueDate: '',
      description: ''
    });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.billNumber || !formData.customerName || !formData.amount || !formData.dueDate) {
      showSnackbar('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    if (dialogMode === 'add') {
      const newBill = {
        id: Date.now(),
        ...formData,
        amount: parseFloat(formData.amount),
        createdDate: new Date().toISOString().split('T')[0]
      };
      setBills((prev) => [...prev, newBill]);
      showSnackbar('Hóa đơn đã được thêm thành công!');
    } else if (dialogMode === 'edit') {
      setBills((prev) =>
        prev.map((bill) => (bill.id === selectedBill.id ? { ...bill, ...formData, amount: parseFloat(formData.amount) } : bill))
      );
      showSnackbar('Hóa đơn đã được cập nhật thành công!');
    }
    handleCloseDialog();
  };

  const handleDelete = (billId) => {
    setBills((prev) => prev.filter((bill) => bill.id !== billId));
    showSnackbar('Hóa đơn đã được xóa thành công!', 'success');
    handleCloseMenu();
  };

  const handleStatusChange = async (billId, newStatus) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'localhost:5000';
      await axios.patch(`${backendUrl}/api/bills/${billId}`, {
        getAuthHeader: () => `Bearer ${localStorage.getItem('auth-token')}`,
        status: newStatus
      });
      setBills((prev) => prev.map((bill) => (bill.id === billId ? { ...bill, status: newStatus } : bill)));

      enqueueSnackbar(`Trạng thái hóa đơn đã được cập nhật ${status}!`, { variant: 'success' });
    } catch (error) {
      console.error('Failed to update status:', error);
      enqueueSnackbar('Cập nhật trạng thái hóa đơn thất bại', { variant: 'error' });
    } finally {
      handleCloseMenu();
    }
  };
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleMenuOpen = (event, billId) => {
    setAnchorEl(event.currentTarget);
    setMenuBillId(billId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuBillId(null);
  };

  const isOverdue = (dueDate, status) => new Date(dueDate) < new Date() && status !== 'PAID';

  // Fetch bills from backend on mount
  useEffect(() => {
    async function fetchBills() {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'localhost:5000';
        const response = await axios.get(`${backendUrl}/api/bills`);
        const data = response.data.data;

        // Map backend data structure to frontend "bill" objects
        const mappedBills = data.map((item) => {
          // Get bill number / voucher code / generate fallback
          let billNumber =
            item.voucher_code || (item.import_order_id ? `IMP-${item._id.substring(0, 6)}` : `EXP-${item._id.substring(0, 6)}`);

          // Customer name: from import_order_id?.warehouse_manager_id?.email or fallback
          let customerName = item.import_order_id?.warehouse_manager_id?.email || 'N/A';

          // Calculate amount = sum of details quantity * unit price
          const amount = item.details.reduce((sum, detail) => sum + detail.quantity * detail.unit_price, 0);

          // Status in uppercase in backend, map to uppercase keys of statusConfig or fallback to 'DRAFT'
          const status = item.status ? item.status.toUpperCase() : 'DRAFT';

          // Due date: use payment_date or createdAt or today fallback
          let dueDate = '';
          if (item.payment_date) {
            dueDate = item.payment_date.substring(0, 10);
          } else if (item.createdAt) {
            dueDate = item.createdAt.substring(0, 10);
          } else {
            dueDate = new Date().toISOString().substring(0, 10);
          }

          // Created date: using createdAt or today fallback
          let createdDate = item.createdAt ? item.createdAt.substring(0, 10) : new Date().toISOString().substring(0, 10);

          // Description: join medicine names and quantities from import_order_id or details
          let description = 'No description';
          if (item.import_order_id?.details?.length) {
            description = item.import_order_id.details.map((d) => `${d.medicine_id?.medicine_name || ''} x${d.quantity}`).join(', ');
          } else if (item.details?.length) {
            description = item.details.map((d) => `${d.medicine_lisence_code} x${d.quantity}`).join(', ');
          }

          return {
            id: item._id,
            billNumber,
            customerName,
            amount,
            status,
            dueDate,
            createdDate,
            description
          };
        });

        setBills(mappedBills);
      } catch (error) {
        console.error('Failed to fetch bills:', error);
        setSnackbar({ open: true, message: 'Không thể tải dữ liệu hóa đơn', severity: 'error' });
      }
    }

    fetchBills();
  }, []);
  const paginatedBills = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredAndSortedBills.slice(start, start + rowsPerPage);
  }, [filteredAndSortedBills, page, rowsPerPage]);

  return (
    <Box p={4} minHeight="100vh">
      <Box maxWidth="1200px" mx="auto">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            Quản lý Hóa đơn
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Quản lí duyệt các hóa đơn được tạo tự động
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2} mb={4}>
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = bills.filter((bill) => bill.status === status).length;
            return (
              <Paper key={status} sx={{ p: 2, flex: '1 1 180px' }}>
                <Box display="flex" alignItems="center" gap={1}>
                  {config.icon}
                  <Box>
                    <Typography variant="h6">{count}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {config.label}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>

        {/* Search and Filter */}
        <Box component={Paper} p={2} mb={4}>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <TextField
              variant="outlined"
              size="small"
              label="Tìm kiếm"
              placeholder="Tìm kiếm theo số hóa đơn hoặc tên khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
              sx={{ flex: '1 1 250px' }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select value={statusFilter} label="Trạng thái" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">Tất cả trạng thái</MenuItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <MenuItem key={status} value={status}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sắp xếp</InputLabel>
              <Select value={sortField} label="Sắp xếp" onChange={(e) => setSortField(e.target.value)}>
                <MenuItem value="createdDate">Ngày tạo</MenuItem>
                <MenuItem value="dueDate">Ngày đến hạn</MenuItem>
                <MenuItem value="amount">Số tiền</MenuItem>
                <MenuItem value="customerName">Tên khách hàng</MenuItem>
                <MenuItem value="billNumber">Số hóa đơn</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            >
              {sortDirection === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            </Button>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell onClick={() => handleSort('billNumber')} sx={{ cursor: 'pointer' }}>
                  Số hóa đơn
                </TableCell>
                <TableCell onClick={() => handleSort('customerName')} sx={{ cursor: 'pointer' }}>
                  Khách hàng
                </TableCell>
                <TableCell onClick={() => handleSort('amount')} sx={{ cursor: 'pointer' }}>
                  Số tiền
                </TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell onClick={() => handleSort('dueDate')} sx={{ cursor: 'pointer' }}>
                  Ngày đến hạn
                </TableCell>
                <TableCell>Mô tả</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBills.length ? (
                paginatedBills.map((bill) => (
                  <TableRow key={bill.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {bill.billNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bill.createdDate}
                      </Typography>
                    </TableCell>
                    <TableCell>{bill.customerName}</TableCell>
                    <TableCell>{formatCurrency(bill.amount)}</TableCell>
                    <TableCell>
                      <Chip
                        size="medium"
                        color={statusConfig[bill.status]?.color || 'default'}
                        icon={statusConfig[bill.status]?.icon || null}
                        sx={{ textTransform: 'none', minWidth: 130 }}
                        label={<Typography variant="body2">{statusConfig[bill.status]?.label || bill.status}</Typography>}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography color={isOverdue(bill.dueDate, bill.status) ? 'error' : 'textPrimary'}>{bill.dueDate}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bill.description}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, bill.id)}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu anchorEl={anchorEl} open={menuBillId === bill.id} onClose={handleCloseMenu}>
                        <MenuItem
                          onClick={() => {
                            handleOpenDialog('view', bill);
                            handleCloseMenu();
                          }}
                        >
                          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                          Xem chi tiết
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleOpenDialog('edit', bill);
                            handleCloseMenu();
                          }}
                        >
                          <EditIcon fontSize="small" sx={{ mr: 1 }} />
                          Chỉnh sửa
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleStatusChange(bill.id, 'PAID');
                          }}
                        >
                          <CheckIcon fontSize="small" sx={{ mr: 1 }} />
                          Đánh dấu đã thanh toán
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleStatusChange(bill.id, 'PENDING');
                          }}
                        >
                          <HourglassEmptyIcon fontSize="small" sx={{ mr: 1 }} />
                          Đánh dấu chờ thanh toán
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleStatusChange(bill.id, 'CANCELLED');
                          }}
                        >
                          <CancelIcon fontSize="small" sx={{ mr: 1 }} />
                          Hủy hóa đơn
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            handleDelete(bill.id);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                          Xóa hóa đơn
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có hóa đơn phù hợp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add New Button */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog('add')}
          sx={{ position: 'fixed', bottom: 24, right: 24, borderRadius: '50%', width: 56, height: 56, minWidth: 0 }}
        >
          <AddIcon />
        </Button>

        {/* Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth scroll="paper">
          <DialogTitle>
            {dialogMode === 'add' && 'Thêm hóa đơn mới'}
            {dialogMode === 'edit' && 'Chỉnh sửa hóa đơn'}
            {dialogMode === 'view' && 'Chi tiết hóa đơn'}
          </DialogTitle>

          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <TextField
                label="Số hóa đơn"
                value={formData.billNumber}
                onChange={(e) => handleFormChange('billNumber', e.target.value)}
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Tên khách hàng"
                value={formData.customerName}
                onChange={(e) => handleFormChange('customerName', e.target.value)}
                disabled={dialogMode === 'view'}
              />
              <TextField
                label="Số tiền"
                type="number"
                value={formData.amount}
                onChange={(e) => handleFormChange('amount', e.target.value)}
                disabled={dialogMode === 'view'}
              />
              <FormControl disabled={dialogMode === 'view'}>
                <InputLabel>Trạng thái</InputLabel>
                <Select value={formData.status} label="Trạng thái" onChange={(e) => handleFormChange('status', e.target.value)}>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <MenuItem key={status} value={status}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Ngày đến hạn"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleFormChange('dueDate', e.target.value)}
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Mô tả"
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                disabled={dialogMode === 'view'}
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              {dialogMode === 'view' ? 'Đóng' : 'Hủy'}
            </Button>
            {dialogMode !== 'view' && (
              <Button onClick={handleSave} variant="contained" color="primary">
                {dialogMode === 'add' ? 'Thêm' : 'Cập nhật'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          message={snackbar.message}
          action={
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleCloseSnackbar}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        />
      </Box>
    </Box>
  );
}

export default HandleBill;
