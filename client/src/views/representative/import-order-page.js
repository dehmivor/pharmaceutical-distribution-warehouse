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
import useTrans from '@/hooks/useTrans';
import WarningIcon from '@mui/icons-material/Warning';

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
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

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

  // Auto-fill all medicines for Economic contracts
  useEffect(() => {
    if (formData.contract_type === 'economic' && contractMedicines.length > 0 && !selectedOrder) {
      const autoFilledDetails = contractMedicines.map((med) => ({
        medicine_id: med.medicine_id._id,
        quantity: med.quantity || med.min_order_quantity || 1,
        unit_price: med.unit_price || 0
      }));
      setFormData((prev) => ({ ...prev, details: autoFilledDetails }));
    }
  }, [formData.contract_type, contractMedicines, selectedOrder]);

  const handleDelete = async (id) => {
    setOrderToDelete(id);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      await axiosInstance.delete(`/import-orders/${orderToDelete}`, {
        headers: getAuthHeaders()
      });
      setSuccess('Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setError(`Failed to delete order: ${errorMessage}`);
    } finally {
      setOpenDeleteDialog(false);
      setOrderToDelete(null);
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
      setError(trans.common.pleaseSelectContractTypeAndContract);
      setFormLoading(false);
      return;
    }

    // Kiểm tra nếu là economic contract và đang tạo mới (không phải update)
    if (formData.contract_type === 'economic' && !selectedOrder) {
      // Kiểm tra xem đã có import order nào với contract này chưa
      const existingOrder = orders.find(order => 
        order.contract_id._id === formData.contract_id && 
        order.status !== 'cancelled'
      );
      
      if (existingOrder) {
        setError(`Đã tồn tại import order với hợp đồng này ở trạng thái "${existingOrder.status}". Chỉ có thể tạo mới khi order cũ có trạng thái "cancelled".`);
        setFormLoading(false);
        return;
      }
    }

    // Validate: không cho chọn trùng thuốc
    const medicineIds = formData.details.map((d) => d.medicine_id);
    const hasDuplicate = new Set(medicineIds).size !== medicineIds.length;
    if (hasDuplicate) {
      setError(trans.common.duplicateMedicineError);
      setFormLoading(false);
      return;
    }
    // Validate: số lượng và đơn giá > 0
    for (const detail of formData.details) {
      if (!detail.medicine_id || detail.quantity <= 0 || detail.unit_price <= 0) {
        setError(trans.common.pleaseFillAllFields);
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
          setError(
            trans.common.quantityMaxForMedicine
              .replace('{medicine}', contractItem?.medicine_id?.medicine_name || '')
              .replace('{max}', maxQ)
          );
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
    setFormLoading(false);
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
        <Typography variant="h4">{trans.common.manageImportOrders}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
          >
            {trans.common.refresh}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()} sx={{ minWidth: 180, height: 48 }}>
            {trans.common.createNewOrder}
          </Button>
        </Box>
      </Box>

      {/* Filter Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterListIcon sx={{ color: 'primary.main', mr: 1 }} />
            <Typography variant="h6" sx={{ color: 'primary.main' }}>{trans.common.searchFilter}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={trans.common.contractCode}
                placeholder={trans.common.contractCodePlaceholder}
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
                <InputLabel>{trans.common.contractType}</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label={trans.common.contractType}
                >
                  <MenuItem value="">{trans.common.allContractTypes}</MenuItem>
                  <MenuItem value="economic">{trans.common.economicContract}</MenuItem>
                  <MenuItem value="principal">{trans.common.principalContract}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>{trans.common.supplier}</InputLabel>
                <Select
                  value={filters.supplier}
                  onChange={(e) => handleFilterChange('supplier', e.target.value)}
                  label={trans.common.supplier}
                >
                  <MenuItem value="">{trans.common.allSuppliers}</MenuItem>
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
                <InputLabel>{trans.common.createdBy}</InputLabel>
                <Select
                  value={filters.created_by}
                  onChange={(e) => handleFilterChange('created_by', e.target.value)}
                  label={trans.common.createdBy}
                >
                  <MenuItem value="">{trans.common.allUsers}</MenuItem>
                  {userEmails.length > 0 && (
                    <MenuItem disabled>
                      <Typography variant="caption" color="text.secondary">
                        ─── {trans.common.selectSpecificEmail} ───
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
                  {trans.common.clearFilters}
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
              <TableCell sx={{ minWidth: 120 }}>{trans.common.contractCode}</TableCell>
              <TableCell sx={{ minWidth: 100 }}>{trans.common.contractType}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{trans.common.supplier}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{trans.common.warehouseManager}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>{trans.common.createdBy}</TableCell>
              <TableCell align="right" sx={{ minWidth: 120 }}>
                {trans.common.totalAmount}
              </TableCell>
              <TableCell sx={{ minWidth: 100 }}>{trans.common.status}</TableCell>
              <TableCell sx={{ minWidth: 120 }}>{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order._id} hover>
                <TableCell>{order.contract_id?.contract_code || trans.common.na}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.contract_id?.contract_type === 'principal' ? trans.common.principalContract : trans.common.economicContract} 
                    color={order.contract_id?.contract_type === 'principal' ? 'primary' : 'secondary'} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{order.contract_id?.partner_id?.name || trans.common.na}</TableCell>
                <TableCell>{order.warehouse_manager_id?.email || trans.common.na}</TableCell>
                <TableCell>{order.created_by?.email || trans.common.na}</TableCell>
                <TableCell align="right">
                  {order.details?.reduce((total, detail) => total + detail.quantity * detail.unit_price, 0).toLocaleString() || 0} {trans.common.currency}
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
          {selectedOrder ? trans.common.editImportOrder : trans.common.createImportOrder}
          {selectedOrder ? (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
              {trans.common.editOrderNote}
            </Typography>
          ) : formData.contract_type === 'principal' ? (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
              {trans.common.principalContractQuantityEditableNote}
            </Typography>
          ) : formData.contract_type === 'economic' && (
            <Typography variant="body2" sx={{ mt: 1, color: 'warning.main', fontWeight: 400 }}>
              {trans.common.economicContractWarning}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, position: 'relative', minHeight: 400 }}>
                        {/* Row: Contract select + Order Details title + Add Medicine */}
            <Grid container alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                <InputLabel>{trans.common.contractType}</InputLabel>
                  <Select
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleFormChange}
                    label={trans.common.contractType}
                    required
                    disabled={!!selectedOrder}
                  >
                    <MenuItem value="">{trans.common.selectContractType}</MenuItem>
                    <MenuItem value="economic">{trans.common.economicContract}</MenuItem>
                    <MenuItem value="principal">{trans.common.principalContract}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                <InputLabel>{trans.common.contract}</InputLabel>
                  <Select
                    name="contract_id"
                    value={formData.contract_id}
                    onChange={handleFormChange}
                    label={trans.common.contract}
                    required
                    disabled={!formData.contract_type || !!selectedOrder}
                  >
                    <MenuItem value="">{trans.common.selectContract}</MenuItem>
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
                  {trans.common.orderDetails}
                  {selectedOrder ? (
                    <Typography variant="caption" sx={{ display: 'block', color: 'warning.main', fontWeight: 400 }}>
                      ({trans.common.editMedicinesOnlyNote})
                    </Typography>
                  ) : formData.contract_type === 'principal' && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'primary.main', fontWeight: 400 }}>
                      ({trans.common.quantityEditableNote})
                    </Typography>
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                {formData.contract_type !== 'economic' && (
                  <Button 
                    onClick={addDetail} 
                    variant="outlined" 
                    size="medium" 
                    disabled={
                      !formData.contract_type || 
                      !formData.contract_id || 
                      medicinesLoading ||
                      (formData.contract_type === 'principal' && 
                       contractMedicines.length > 0 && 
                       formData.details.length >= contractMedicines.length)
                    } 
                    sx={{ minWidth: 140, fontWeight: 600 }}
                  >
                     {selectedOrder ? trans.common.addMedicine : trans.common.addMedicineQuantityOnly}
                  </Button>
                )}
              </Grid>
            </Grid>
            {/* Medicines List */}
            <Grid container spacing={2}>
              {formData.details.length === 0 && (!formData.contract_type || !formData.contract_id) && !medicinesLoading && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedOrder 
                      ? trans.common.editMedicinesOnly
                      : !formData.contract_type 
                        ? trans.common.pleaseSelectContractType
                        : !formData.contract_id 
                          ? trans.common.pleaseSelectContract
                          : formData.contract_type === 'principal'
                            ? trans.common.principalContractQuantityEditable
                            : formData.contract_type === 'economic'
                              ? trans.common.economicContractAutoFilled
                              : trans.common.pleaseAddMedicines
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
                          <InputLabel>{trans.common.medicine}</InputLabel>
                          <Select
                            value={detail.medicine_id}
                            onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                            label={trans.common.medicine}
                            required
                            disabled={!formData.contract_id || medicinesLoading || formData.contract_type === 'economic'}
                            sx={{ minWidth: 200, maxWidth: 240 }}
                          >
                             <MenuItem value="">{trans.common.selectMedicine || 'Select Medicine'}</MenuItem>
                             {medicinesLoading ? (
                               <MenuItem disabled>{trans.common.loading || 'Loading...'}</MenuItem>
                            ) : (
                              contractMedicines
                                .filter((med) => {
                                  // For principal contract, filter out already selected medicines
                                  if (formData.contract_type === 'principal') {
                                    return !formData.details.some((detail, i) => 
                                      detail.medicine_id === med.medicine_id._id && i !== index
                                    );
                                  }
                                  // For economic contract, show all medicines
                                  return true;
                                })
                                .map((med) => (
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
                          label={trans.common.quantity}
                          type="text"
                          value={detail.quantity ? detail.quantity.toLocaleString() : ''}
                          onChange={(e) => {
                            // Remove all non-digit characters and convert to number
                            const rawValue = e.target.value.replace(/[^\d]/g, '');
                            const value = parseInt(rawValue) || 0;
                            // Prevent negative values
                            const validValue = Math.max(1, value);
                            handleDetailChange(index, 'quantity', validValue);
                          }}
                          onBlur={(e) => {
                            // Format on blur if empty
                            if (!e.target.value) {
                              handleDetailChange(index, 'quantity', 0);
                            }
                          }}
                          InputProps={{ 
                            readOnly: formData.contract_type !== 'principal',
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                          }}
                          required
                          disabled={!detail.medicine_id || medicinesLoading}
                          helperText={(() => {
                            const contractItem = contractMedicines.find((med) => med.medicine_id._id === detail.medicine_id);
                            if (contractItem) {
                              if (formData.contract_type === 'principal') {
                                return `Min: ${(contractItem.min_order_quantity || 1).toLocaleString()} (${trans.common.quantityEditableNote})`;
                              } else {
                                return `${trans.common.fromContractEconomicCannotEdit}`;
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
                          label={trans.common.unitPrice}
                          type="text"
                          value={detail.unit_price ? detail.unit_price.toLocaleString() : ''}
                          InputProps={{ readOnly: true }}
                          required
                          disabled={!detail.medicine_id || medicinesLoading}
                          helperText={trans.common.fromContract}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '1 0 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label={trans.common.total}
                          value={(detail.quantity * detail.unit_price).toLocaleString()}
                          InputProps={{ readOnly: true }}
                          disabled={!detail.medicine_id || medicinesLoading}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      {formData.contract_type !== 'economic' && (
                        <Grid item sx={{ flex: '0 0 56px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <IconButton color="error" onClick={() => removeDetail(index)} disabled={formData.details.length === 1 || !detail.medicine_id || medicinesLoading}>
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {/* Total Amount bottom right */}
            {formData.details.some(detail => detail.medicine_id) && !medicinesLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 4, mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {trans.common.totalAmount}: {calculateTotal().toLocaleString()} {trans.common.currency}
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
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>{trans.common.orderDetailsTitle}</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6">{trans.common.basicInformation}</Typography>
                  <Paper sx={{ p: 2 }}>
                    <Typography>
                      <strong>{trans.common.contract}:</strong> {selectedOrder.contract_id?.contract_code}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>{trans.common.contractType}:</strong>
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
                      <strong>{trans.common.supplier}:</strong> {selectedOrder.contract_id?.partner_id?.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>{trans.common.status}:</strong>
                      </Typography>
                      <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" sx={{ ml: 1 }} />
                    </Box>
                  </Paper>
                </Grid>
                                      <Grid item xs={12} md={6}>
                         <Typography variant="h6">{trans.common.orderDetailsTitle}</Typography>
                        <TableContainer component={Paper}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>{trans.common.medicine}</TableCell>
                                <TableCell align="right">{trans.common.quantity}</TableCell>
                                <TableCell align="right">{trans.common.unitPrice}</TableCell>
                                <TableCell align="right">{trans.common.total}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedOrder.details?.map((detail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{detail.medicine_id?.medicine_name || trans.common.na}</TableCell>
                                  <TableCell align="right">{detail.quantity}</TableCell>
                                  <TableCell align="right">{detail.unit_price?.toLocaleString()} {trans.common.currency}</TableCell>
                                  <TableCell align="right">{((detail.quantity || 0) * (detail.unit_price || 0)).toLocaleString()} {trans.common.currency}</TableCell>
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
            {trans.common.close}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)} 
        maxWidth="xs" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,0,0,0.08)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontWeight: 600, 
          color: 'error.main',
          fontSize: '1.25rem',
          py: 2,
          borderBottom: '1px solid rgba(255,0,0,0.08)',
          background: 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
            <Box sx={{
              width: 45,
              height: 45,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(255,107,107,0.25)',
              mb: 1
            }}>
              <DeleteIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
          </Box>
          {trans.common.confirmDelete || 'Confirm Delete'}
        </DialogTitle>
        <DialogContent sx={{ py: 2.5, px: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" sx={{ 
              mb: 2, 
              fontWeight: 500,
              color: 'text.primary',
              lineHeight: 1.4
            }}>
              {trans.common.deleteOrderConfirmation || 'Are you sure you want to delete this import order?'}
            </Typography>
            
            <Box sx={{
              background: 'linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)',
              borderRadius: 1.5,
              p: 2,
              border: '1px solid #ffb74d',
              mb: 2
            }}>
              <Typography variant="body2" sx={{ 
                color: '#e65100',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                fontSize: '0.875rem'
              }}>
                <WarningIcon sx={{ fontSize: 18 }} />
                {trans.common.deleteOrderWarning || 'This action cannot be undone.'}
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ 
              fontStyle: 'italic',
              opacity: 0.7
            }}>
              {trans.common.deleteOrderNote || 'Please review before proceeding.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          gap: 2, 
          pb: 3, 
          px: 3,
          borderTop: '1px solid rgba(0,0,0,0.06)',
          background: '#fafafa'
        }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            variant="outlined" 
            sx={{ 
              minWidth: 110,
              height: 40,
              borderRadius: 1.5,
              borderColor: 'grey.400',
              color: 'text.secondary',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.875rem',
              '&:hover': {
                borderColor: 'grey.600',
                background: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            {trans.common.cancel || 'Cancel'}
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            sx={{ 
              minWidth: 110,
              height: 40,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
              fontWeight: 500,
              textTransform: 'none',
              fontSize: '0.875rem',
              boxShadow: '0 6px 20px rgba(255,107,107,0.25)',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)',
                boxShadow: '0 8px 25px rgba(255,107,107,0.35)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {trans.common.delete || 'Delete'}
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
