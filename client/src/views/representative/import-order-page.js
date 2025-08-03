'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TablePagination,
  Snackbar,
  Alert,
  Chip,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon, Refresh as RefreshIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true
});

function ImportOrderPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    contract_code: '',
    contract_type: '',
    supplier: '',
    date_filter: '',
    created_by: ''
  });
  const [userEmails, setUserEmails] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Form states
  const [formData, setFormData] = useState({
    contract_type: '', // Thêm contract_type
    contract_id: '',
    details: [
      {
        medicine_id: '',
        quantity: 0,
        unit_price: 0
      }
    ]
  });

  const [contracts, setContracts] = useState([]);
  const [warehouseManagers, setWarehouseManagers] = useState([]);
  const [contractMedicines, setContractMedicines] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [medicinesLoading, setMedicinesLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/import-orders`, {
        headers: getAuthHeaders()
      });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user emails for filter
  const fetchUserEmails = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/import-orders`, {
        headers: getAuthHeaders()
      });

      // Extract unique emails from orders
      const emails = new Set();
      response.data.data?.forEach(order => {
        if (order.created_by?.email) {
          emails.add(order.created_by.email);
        }
      });

      setUserEmails(Array.from(emails).sort());
    } catch (error) {
      console.error('Error fetching user emails:', error);
      setUserEmails([]);
    }
  };

  // Fetch suppliers for filter
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/import-orders`, {
        headers: getAuthHeaders()
      });

      // Extract unique suppliers from orders
      const supplierSet = new Set();
      response.data.data?.forEach(order => {
        if (order.contract_id?.partner_id?.name) {
          supplierSet.add(order.contract_id.partner_id.name);
        }
      });

      setSuppliers(Array.from(supplierSet).sort());
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers([]);
    }
  };

  const fetchContracts = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Chỉ lấy hợp đồng Supplier và active, không filter theo contract_type nữa
      const response = await axios.get(
        `${backendUrl}/api/contract?partner_type=Supplier&status=active`,
        { headers: getAuthHeaders() }
      );
      const activeContracts = (response.data.data.contracts || []).filter(
        (c) => c.status === 'active' && c.partner_type === 'Supplier'
      );
      setContracts(activeContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      setError('Failed to load contracts');
    }
  };

  const fetchWarehouseManagers = async () => {
    try {
      const response = await axiosInstance.get('/accounts?role=warehouse_manager', {
        headers: getAuthHeaders()
      });
      setWarehouseManagers(response.data.data || []);
    } catch (error) {
      setWarehouseManagers([]);
    }
  };

  const fetchContractMedicines = async (contractId) => {
    if (!contractId) {
      setContractMedicines([]);
      return;
    }
    setMedicinesLoading(true);
    try {
      const response = await axiosInstance.get(`/contract/${contractId}/medicines`, {
        headers: getAuthHeaders()
      });
      console.log('Contract medicines loaded:', response.data.data);
      setContractMedicines(response.data.data || []);
    } catch (error) {
      console.error('Error fetching contract medicines:', error);
      setError('Failed to load contract medicines');
      setContractMedicines([]);
    } finally {
      setMedicinesLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchContracts();
    fetchWarehouseManagers();
    fetchUserEmails();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (formData.contract_id) {
      fetchContractMedicines(formData.contract_id);
    } else {
      setContractMedicines([]);
    }
  }, [formData.contract_id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      return;
    }

    try {
      await axiosInstance.delete(`/import-orders/${id}`, {
        headers: getAuthHeaders()
      });
      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(`Failed to delete order: ${errorMessage}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contract_type') {
      // Khi chọn contract_type, reset contract_id và details (chỉ khi tạo mới)
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        contract_id: '',
        details: selectedOrder ? prev.details : [] // Giữ nguyên details khi update
      }));
      // Reset contract medicines khi thay đổi contract type (chỉ khi tạo mới)
      if (!selectedOrder) {
        setContractMedicines([]);
      }
    } else if (name === 'contract_id') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        details: selectedOrder ? prev.details : [] // Giữ nguyên details khi update
      }));
      // Reset contract medicines khi thay đổi contract (chỉ khi tạo mới)
      if (!selectedOrder) {
        setContractMedicines([]);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    newDetails[index] = {
      ...newDetails[index],
      [field]: value
    };

    // If medicine changes, get unit price and quantity from contract
    if (field === 'medicine_id') {
      const selectedMedicine = contractMedicines.find((med) => med.medicine_id._id === value);
      if (selectedMedicine) {
        if (formData.contract_type === 'principal') {
          // Với principal contract, chỉ set giá trị mặc định, người dùng có thể chỉnh sửa
          newDetails[index].unit_price = selectedMedicine.unit_price || 0;
          newDetails[index].quantity = selectedMedicine.min_order_quantity || 1;
        } else {
          // Với economic contract, giữ nguyên logic cũ
          newDetails[index].unit_price = selectedMedicine.unit_price || 0;
          newDetails[index].quantity = selectedMedicine.quantity || selectedMedicine.min_order_quantity || 1;
        }
        console.log('Selected medicine:', selectedMedicine.medicine_id.medicine_name, 'Unit price:', selectedMedicine.unit_price, 'Quantity:', newDetails[index].quantity);
      }
    }

    setFormData((prev) => ({
      ...prev,
      details: newDetails
    }));
  };

  const addDetail = () => {
    setFormData((prev) => ({
      ...prev,
      details: [
        ...prev.details,
        {
          medicine_id: '',
          quantity: 0,
          unit_price: 0
        }
      ]
    }));
  };

  const removeDetail = (index) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const calculateTotal = () => {
    return formData.details.reduce((total, detail) => {
      return total + detail.quantity * detail.unit_price;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Validate: phải chọn contract_type và contract_id
    if (!formData.contract_type || !formData.contract_id) {
      setError('Vui lòng chọn loại hợp đồng và hợp đồng cụ thể!');
      setFormLoading(false);
      return;
    }

    // Validate: không cho chọn trùng thuốc
    const medicineIds = formData.details.map((d) => d.medicine_id);
    const hasDuplicate = new Set(medicineIds).size !== medicineIds.length;
    if (hasDuplicate) {
      setError('Không được chọn trùng thuốc trong cùng một phiếu nhập!');
      setFormLoading(false);
      return;
    }
    // Validate: số lượng và đơn giá > 0
    for (const detail of formData.details) {
      if (!detail.medicine_id || detail.quantity <= 0 || detail.unit_price <= 0) {
        setError('Vui lòng nhập đầy đủ, số lượng và đơn giá phải lớn hơn 0!');
        setFormLoading(false);
        return;
      }
      
      const contractItem = contractMedicines.find((med) => med.medicine_id._id === detail.medicine_id);
      
      if (formData.contract_type === 'economic') {
        // Với economic contract, giữ nguyên validation cũ
        // Validate: số lượng nhập phải >= min_order_quantity từ hợp đồng
        if (contractItem && detail.quantity < contractItem.min_order_quantity) {
          setError(
            `Số lượng nhập cho thuốc "${contractItem.medicine_id.medicine_name}" phải tối thiểu là ${contractItem.min_order_quantity}`
          );
          setFormLoading(false);
          return;
        }
        // Validate: số lượng nhập không vượt quá max_quantity hoặc 1000
        const maxQ = contractItem?.max_quantity || 1000;
        if (detail.quantity > maxQ) {
          setError(`Số lượng nhập cho thuốc "${contractItem?.medicine_id?.medicine_name || ''}" không được vượt quá ${maxQ}`);
          setFormLoading(false);
          return;
        }
      } else if (formData.contract_type === 'principal') {
        // Với principal contract, chỉ validate cơ bản
        // Validate: số lượng nhập phải >= 1
        if (detail.quantity < 1) {
          setError(`Số lượng nhập cho thuốc phải tối thiểu là 1`);
          setFormLoading(false);
          return;
        }
        // Validate: số lượng nhập không vượt quá 10000 (giới hạn cao hơn cho principal)
        if (detail.quantity > 10000) {
          setError(`Số lượng nhập cho thuốc không được vượt quá 10,000`);
          setFormLoading(false);
          return;
        }
      }
    }

    try {
      const orderData = {
        contract_id: formData.contract_id,
        total: calculateTotal()
      };
      const orderDetails = formData.details;
      const url = selectedOrder ? `/import-orders/${selectedOrder._id}` : '/import-orders';
      if (selectedOrder) {
        await axiosInstance.put(
          url,
          { orderData, orderDetails },
          {
            headers: getAuthHeaders()
          }
        );
      } else {
        await axiosInstance.post(
          url,
          { orderData, orderDetails },
          {
            headers: getAuthHeaders()
          }
        );
      }
      setSuccess(selectedOrder ? 'Order updated successfully' : 'Order created successfully');
      handleCloseForm();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = (order = null) => {
    if (order) {
      setFormData({
        contract_type: order.contract_id?.contract_type || '', // Thêm contract_type
        contract_id: order.contract_id._id || order.contract_id,
        details: order.details.map((d) => ({
          ...d,
          medicine_id: typeof d.medicine_id === 'object' ? d.medicine_id._id : d.medicine_id
        }))
      });
    } else {
      setFormData({
        contract_type: '', // Thêm contract_type
        contract_id: '',
        details: []
      });
    }
    setSelectedOrder(order);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setSelectedOrder(null);
    setOpenForm(false);
    setFormData({
      contract_type: '', // Thêm contract_type
      contract_id: '',
      details: []
    });
  };

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'delivered':
        return 'info';
      case 'checked':
        return 'warning';
      case 'arranged':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      contract_code: '',
      contract_type: '',
      supplier: '',
      date_filter: '',
      created_by: ''
    });
  };

  // Filter contracts based on selected contract_type
  const filteredContracts = contracts.filter(contract => {
    if (!formData.contract_type) return true;
    return contract.contract_type === formData.contract_type;
  });

  // Filter orders based on current filters
  const filteredOrders = orders.filter((order) => {
    if (filters.contract_code && !order.contract_id?.contract_code?.toLowerCase().includes(filters.contract_code.toLowerCase())) return false;
    if (filters.contract_type && order.contract_id?.contract_type !== filters.contract_type) return false;
    if (filters.supplier && order.contract_id?.partner_id?.name !== filters.supplier) return false;
    if (filters.created_by && order.created_by?.email !== filters.created_by) return false;
    return true;
  });

  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Import Orders</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()} sx={{ minWidth: 180, height: 48 }}>
            Create New Order
          </Button>
        </Box>
      </Box>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'primary.main' }}>Bộ Lọc Tìm Kiếm</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label="Mã hợp đồng"
                placeholder="Tìm kiếm theo mã hợp đồng..."
                value={filters.contract_code || ''}
                onChange={(e) => handleFilterChange('contract_code', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      🔍
                    </Box>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Loại hợp đồng</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label="Loại hợp đồng"
                >
                  <MenuItem value="">Tất cả loại hợp đồng</MenuItem>
                  <MenuItem value="economic">Economic Contract</MenuItem>
                  <MenuItem value="principal">Principal Contract</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Nhà cung cấp</InputLabel>
                <Select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  label="Nhà cung cấp"
                >
                  <MenuItem value="">Tất cả nhà cung cấp</MenuItem>
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier} value={supplier}>
                      {supplier}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Người tạo</InputLabel>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  label="Người tạo"
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {userEmails.length > 0 && (
                    <MenuItem disabled>
                      <Typography variant="caption" color="text.secondary">
                        ─── Chọn email cụ thể ───
                      </Typography>
                    </MenuItem>
                  )}
                  {userEmails.map((email) => (
                    <MenuItem key={email} value={email}>
                      {email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: '100%' }}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  fullWidth
                >
                  Xóa bộ lọc
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2, mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 120 }}>Contract Code</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Contract Type</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Supplier</TableCell>
              <TableCell sx={{ minWidth: 150 }}>Warehouse Manager</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Created By</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                Total Amount
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
              <TableCell sx={{ minWidth: 120 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.contract_id?.contract_type === 'principal' ? 'Principal' : 'Economic'} 
                    color={order.contract_id?.contract_type === 'principal' ? 'primary' : 'secondary'} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{order.contract_id?.partner_id?.name || 'N/A'}</TableCell>
                <TableCell>{order.warehouse_manager_id?.email || 'N/A'}</TableCell>
                <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                <TableCell align="right">
                  {order.details?.reduce((total, detail) => total + detail.quantity * detail.unit_price, 0).toLocaleString() || 0} VND
                </TableCell>
                <TableCell>
                  <Chip label={order.status} color={getStatusColor(order.status)} size="small" />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {/* Chỉ hiển thị nút edit cho draft và rejected orders */}
                    {(order.status === 'draft' || order.status === 'rejected') && (
                      <IconButton color="primary" onClick={() => handleOpenForm(order)} title="Edit order">
                        <EditIcon />
                      </IconButton>
                    )}
                    {/* Chỉ hiển thị nút delete cho draft và cancelled orders */}
                    {(order.status === 'draft' || order.status === 'cancelled') && (
                      <IconButton color="error" onClick={() => handleDelete(order._id)} title="Delete order">
                        <DeleteIcon />
                      </IconButton>
                    )}
                    <IconButton color="info" onClick={() => handleOpenDetails(order)}>
                      <InfoIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ px: 2, py: 1 }}
        />
      </TableContainer>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          {selectedOrder ? 'Edit Import Order' : 'Create New Import Order'}
          {selectedOrder ? (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
              You can only edit medicines in this order
            </Typography>
          ) : formData.contract_type === 'principal' && (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
              Principal Contract - Quantity can be edited
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, position: 'relative', minHeight: 400 }}>
                        {/* Row: Contract select + Order Details title + Add Medicine */}
            <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Contract Type</InputLabel>
                  <Select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleFormChange}
                    label="Contract Type"
                    required
                    disabled={!!selectedOrder}
                  >
                    <MenuItem value="">Select Contract Type</MenuItem>
                    <MenuItem value="economic">Economic Contract</MenuItem>
                    <MenuItem value="principal">Principal Contract</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Contract</InputLabel>
                  <Select
                    name="contract_id"
                    value={formData.contract_id}
                    onChange={handleFormChange}
                    label="Contract"
                    required
                    disabled={!formData.contract_type || !!selectedOrder}
                  >
                    <MenuItem value="">Select Contract</MenuItem>
                    {filteredContracts.map((contract) => (
                      <MenuItem key={contract._id} value={contract._id}>
                        {contract.contract_code} - {contract.partner_id?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Order Details
                  {selectedOrder ? (
                    <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', fontWeight: 400 }}>
                      (Edit medicines only)
                    </Typography>
                  ) : formData.contract_type === 'principal' && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 400 }}>
                      (Editable quantities)
                    </Typography>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Button onClick={addDetail} variant="outlined" size="medium" disabled={!formData.contract_type || !formData.contract_id || medicinesLoading} sx={{ minWidth: 140, fontWeight: 600 }}>
                  {selectedOrder ? 'Add Medicine' : (formData.contract_type === 'principal' ? 'Add Medicine (Quantity Editable)' : 'Add Medicine')}
                </Button>
              </Grid>
            </Grid>
            {/* Medicines List */}
            <Grid container spacing={2}>
              {formData.details.length === 0 && (!formData.contract_type || !formData.contract_id) && !medicinesLoading && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedOrder 
                      ? "You can only edit medicines in this order"
                      : !formData.contract_type 
                        ? "Please select a Contract Type first" 
                        : !formData.contract_id 
                          ? "Please select a Contract to load available medicines"
                          : formData.contract_type === 'principal'
                            ? "Please add medicines to your order (Principal contract allows quantity editing)"
                            : "Please add medicines to your order"
                    }
                  </Alert>
                </Grid>
              )}
              {formData.details.map((detail, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2, mb: 1, borderRadius: 2, boxShadow: 1 }}>
                    <Grid container spacing={2} alignItems="center" justifyContent="center" wrap="nowrap">
                      <Grid item sx={{ flex: '1 1 0', minWidth: 220, maxWidth: 260 }}>
                        <FormControl fullWidth>
                          <InputLabel>Medicine</InputLabel>
                          <Select
                            value={detail.medicine_id}
                            onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                            label="Medicine"
                            required
                            disabled={!formData.contract_id || medicinesLoading}
                            sx={{ minWidth: 200, maxWidth: 240 }}
                          >
                            <MenuItem value="">Select Medicine</MenuItem>
                            {medicinesLoading ? (
                              <MenuItem disabled>Loading medicines...</MenuItem>
                            ) : (
                              contractMedicines.map((med) => (
                                <MenuItem key={med.medicine_id._id} value={med.medicine_id._id}>
                                  {med.medicine_id.medicine_name} - {med.medicine_id.license_code}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item sx={{ flex: '1 1 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => handleDetailChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          InputProps={{ 
                            readOnly: formData.contract_type !== 'principal',
                            min: 1
                          }}
                          required
                          disabled={!detail.medicine_id || medicinesLoading}
                          helperText={(() => {
                            const contractItem = contractMedicines.find((med) => med.medicine_id._id === detail.medicine_id);
                            if (contractItem) {
                              if (formData.contract_type === 'principal') {
                                return `Min: ${contractItem.min_order_quantity || 1} (Có thể chỉnh sửa)`;
                              } else {
                                return `Từ hợp đồng: ${contractItem.quantity || contractItem.min_order_quantity || 1}`;
                              }
                            }
                            return '';
                          })()}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '1 1 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label="Unit Price"
                          type="number"
                          value={detail.unit_price}
                          InputProps={{ readOnly: true }}
                          required
                          disabled={!detail.medicine_id || medicinesLoading}
                          helperText="(Từ hợp đồng)"
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '1 0 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label="Total"
                          value={(detail.quantity * detail.unit_price).toLocaleString()}
                          InputProps={{ readOnly: true }}
                          disabled={!detail.medicine_id || medicinesLoading}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '0 0 56px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton color="error" onClick={() => removeDetail(index)} disabled={formData.details.length === 1 || !detail.medicine_id || medicinesLoading}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {/* Total Amount bottom right */}
            {formData.details.some(detail => detail.medicine_id) && !medicinesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 4, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total Amount: {calculateTotal().toLocaleString()} VND
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseForm} disabled={formLoading || medicinesLoading} variant="outlined" sx={{ minWidth: 120 }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={formLoading || medicinesLoading || !formData.contract_type || !formData.contract_id || formData.details.length === 0 || !formData.details.some(detail => detail.medicine_id)} 
            sx={{ minWidth: 120 }}
          >
            {formLoading ? 'Saving...' : selectedOrder ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>Import Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">Basic Information</Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography>
                      <strong>Contract:</strong> {selectedOrder.contract_id?.contract_code}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>Contract Type:</strong>
                      </Typography>
                      <Chip 
                        label={selectedOrder.contract_id?.contract_type === 'principal' ? 'Principal' : 'Economic'} 
                        color={selectedOrder.contract_id?.contract_type === 'principal' ? 'primary' : 'secondary'} 
                        size="small" 
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography>
                      <strong>Supplier:</strong> {selectedOrder.contract_id?.partner_id?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>Status:</strong>
                      </Typography>
                      <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" sx={{ ml: 1 }} />
                    </Box>
                  </Paper>
                </Grid>
                                      <Grid item xs={12} md={6}>
                        <Typography variant="h6">Order Details</Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Medicine</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="right">Unit Price</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedOrder.details?.map((detail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{detail.medicine_id?.medicine_name || 'N/A'}</TableCell>
                                  <TableCell align="right">{detail.quantity}</TableCell>
                                  <TableCell align="right">{detail.unit_price?.toLocaleString()} VND</TableCell>
                                  <TableCell align="right">{((detail.quantity || 0) * (detail.unit_price || 0)).toLocaleString()} VND</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseDetails} variant="outlined" sx={{ minWidth: 120 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ImportOrderPage;
