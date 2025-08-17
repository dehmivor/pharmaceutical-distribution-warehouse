'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, TextField, Grid, MenuItem, FormControl, InputLabel, Select, IconButton, Menu, TablePagination, Card, CardContent, CircularProgress
} from '@mui/material';
import { Add as AddIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon, Refresh as RefreshIcon, FilterList as FilterListIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import useTrans from '@/hooks/useTrans';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

function ExportOrderPage() {
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [formData, setFormData] = useState({ 
    contract_type: '', 
    contract_id: '', 
    details: [] 
  });
  const [contracts, setContracts] = useState([]);
  const [contractMedicines, setContractMedicines] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);

  // Thêm state cho stock validation
  const [stockCheckResults, setStockCheckResults] = useState([]);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockValidationError, setStockValidationError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    contract_code: '',
    contract_type: '',
    date_filter: '',
    created_by: ''
  });
  const [userEmails, setUserEmails] = useState([]);

  // Định nghĩa lại hàm fetchOrders
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, { headers: getAuthHeaders() });
      setOrders(response.data.data || []);
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Định nghĩa lại hàm fetchContracts
  const fetchContracts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract?status=active&partner_type=Retailer`, { headers: getAuthHeaders() });
      setContracts(response.data.data.contracts || []);
    } catch (error) {
      setError('Failed to load contracts');
    }
  };

  // Lấy danh sách thuốc từ contract khi chọn contract (bao gồm cả phụ lục)
  const fetchContractMedicines = async (contractId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/contract/${contractId}/medicines`, { headers: getAuthHeaders() });
      setContractMedicines(response.data.data || []);
    } catch (error) {
      setContractMedicines([]);
    }
  };

  // Fetch user emails for filter
  const fetchUserEmails = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/export-orders`, {
        headers: getAuthHeaders()
      });

      // Extract unique emails from orders
      const emails = new Set();
      response.data.data?.forEach(order => {
        if (order.created_by?.email) {
          emails.add(order.created_by.email);
        }
      });

      setUserEmails(Array.from(emails));
    } catch (error) {
      console.error('Error fetching user emails:', error);
    }
  };

  // Function để kiểm tra tồn kho với debounce
  const checkStockAvailability = async (details) => {
    if (!details || details.length === 0) {
      setStockCheckResults([]);
      return { success: true, all_available: true };
    }

    // Chỉ kiểm tra những detail có đủ thông tin
    const validDetails = details.filter(detail => 
      detail.medicine_id && detail.expected_quantity > 0
    );

    if (validDetails.length === 0) {
      setStockCheckResults([]);
      return { success: true, all_available: true };
    }

    try {
      setIsCheckingStock(true);
      setStockValidationError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/export-orders/check-stock`,
        { details: validDetails },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setStockCheckResults(response.data.data.stock_check_results);
        return {
          success: true,
          ...response.data.data
        };
      } else {
        throw new Error(response.data.message || 'Failed to check stock');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setStockValidationError(errorMessage);
      return { success: false, all_available: false, error: errorMessage };
    } finally {
      setIsCheckingStock(false);
    }
  };

  // Debounced stock check function
  const debouncedStockCheck = useCallback(
    debounce((details) => {
      checkStockAvailability(details);
    }, 800),
    []
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  useEffect(() => {
    fetchOrders();
    fetchContracts();
    fetchUserEmails();
  }, []);

  // Reset stock check results when form is closed
  useEffect(() => {
    if (!openForm && !openEditForm) {
      setStockCheckResults([]);
      setStockValidationError(null);
      setIsCheckingStock(false);
    }
  }, [openForm, openEditForm]);

  // Auto check stock when form opens with details
  useEffect(() => {
    if ((openForm || openEditForm) && formData.details.length > 0) {
      const validDetails = formData.details.filter(detail => 
        detail.medicine_id && detail.expected_quantity > 0
      );
      if (validDetails.length > 0) {
        debouncedStockCheck(formData.details);
      }
    }
  }, [openForm, openEditForm, formData.details.length]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  // Gọi fetchContractMedicines khi chọn contract
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
        expected_quantity: med.quantity || med.min_order_quantity || 1,
        unit_price: med.unit_price || 0
      }));
      setFormData((prev) => ({ ...prev, details: autoFilledDetails }));
    }
  }, [formData.contract_type, contractMedicines, selectedOrder]);

  // Khi chọn contract, reset details về rỗng
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
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Khi chọn thuốc, tự động fill số lượng và giá từ contract
  const handleDetailChange = (index, field, value) => {
    const newDetails = [...formData.details];
    
    // If medicine changes, get unit price and quantity from contract
    if (field === 'medicine_id') {
      const selectedMedicine = contractMedicines.find((med) => med.medicine_id._id === value);
      if (selectedMedicine) {
        if (formData.contract_type === 'principal') {
          // Với principal contract, chỉ set giá trị mặc định, người dùng chỉ có thể chỉnh sửa quantity
          newDetails[index].unit_price = selectedMedicine.unit_price || 0;
          newDetails[index].expected_quantity = selectedMedicine.min_order_quantity || 1;
        } else {
          // Với economic contract, giữ nguyên logic cũ
          newDetails[index].unit_price = selectedMedicine.unit_price || 0;
          newDetails[index].expected_quantity = selectedMedicine.quantity || selectedMedicine.min_order_quantity || 1;
        }
      }
      newDetails[index][field] = value;
    } else if (field === 'expected_quantity') {
      // Xử lý thay đổi quantity
      if (formData.contract_type === 'economic') {
        // Economic contract: không cho phép sửa quantity
        return;
      }
      // Principal contract: cho phép sửa quantity
      newDetails[index][field] = Number(value);
    } else if (field === 'unit_price') {
      // Xử lý thay đổi unit_price
      // Cả economic và principal contract đều không cho phép sửa unit_price
      return;
    } else {
      newDetails[index][field] = value;
    }
    
    setFormData((prev) => ({ ...prev, details: newDetails }));

    // Tự động kiểm tra tồn kho khi thay đổi thuốc hoặc số lượng (với debounce)
    if (field === 'medicine_id' || field === 'expected_quantity') {
      debouncedStockCheck(newDetails);
    }
  };

  // Add Medicine: thêm dòng mới với medicine_id rỗng
  const addDetail = () => {
    setFormData((prev) => ({ ...prev, details: [...prev.details, { medicine_id: '', expected_quantity: 0, unit_price: 0 }] }));
  };

  const removeDetail = (index) => {
    setFormData((prev) => ({ ...prev, details: prev.details.filter((_, i) => i !== index) }));
  };

  // Action handlers
  const handleActionMenuOpen = (event, order) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderForAction(order);
  };

  const handleActionMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderForAction(null);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setOpenDetails(true);
    handleActionMenuClose();
  };

  const handleEditOrder = (order) => {
    setFormData({
      contract_type: order.contract_id?.contract_type || '',
      contract_id: order.contract_id._id || order.contract_id,
      details: order.details.map((d) => ({
        medicine_id: typeof d.medicine_id === 'object' ? d.medicine_id._id : d.medicine_id,
        expected_quantity: d.expected_quantity,
        unit_price: d.unit_price
      }))
    });
    setSelectedOrder(order);
    setOpenEditForm(true);
    handleActionMenuClose();
    
    // Thông báo nếu đang sửa rejected order
    if (order.status === 'rejected') {
      setSuccess(trans.common.editingRejectedExportOrder);
    }
    
    // Auto-check stock khi mở edit form
    const details = order.details.map((d) => ({
      medicine_id: typeof d.medicine_id === 'object' ? d.medicine_id._id : d.medicine_id,
      expected_quantity: d.expected_quantity,
      unit_price: d.unit_price
    }));
    
    // Fetch contract medicines trước khi check stock
    if (order.contract_id?._id || order.contract_id) {
      fetchContractMedicines(order.contract_id._id || order.contract_id).then(() => {
        // Check stock sau khi có contract medicines
        checkStockAvailability(details);
      });
    } else {
      checkStockAvailability(details);
    }
  };

  const handleDeleteOrder = async (order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) {
      handleActionMenuClose();
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/api/export-orders/${order._id}`, {
        headers: getAuthHeaders()
      });
      setSuccess('Order deleted successfully');
      // Refresh table after delete
      await fetchOrders();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setError(`Failed to delete order: ${errorMessage}`);
    } finally {
      handleActionMenuClose();
    }
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    setOpenDetails(false);
  };

  const handleCloseEditForm = () => {
    setSelectedOrder(null);
    setOpenEditForm(false);
    setFormData({ contract_type: '', contract_id: '', details: [] });
    setStockCheckResults([]); // Reset stock check results
    setStockValidationError(null);
    setIsCheckingStock(false);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setSelectedOrder(null);
    setFormData({ contract_type: '', contract_id: '', details: [] });
    setStockCheckResults([]); // Reset stock check results
    setStockValidationError(null);
    setIsCheckingStock(false);
    setFormLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
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
      status: '',
      contract_code: '',
      contract_type: '',
      date_filter: '',
      created_by: ''
    });
  };

  // Filter orders based on current filters
  const filteredOrders = orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.contract_code && !order.contract_id?.contract_code?.toLowerCase().includes(filters.contract_code.toLowerCase())) return false;
    if (filters.contract_type && order.contract_id?.contract_type !== filters.contract_type) return false;
    if (filters.created_by && order.created_by?.email !== filters.created_by) return false;
    return true;
  });

  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Refresh table
  const handleRefresh = () => {
    fetchOrders();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate: phải chọn contract_type và contract_id
    if (!formData.contract_type || !formData.contract_id) {
      setError(trans.common.pleaseSelectContractTypeAndContract);
      setFormLoading(false);
      return;
    }

    // Kiểm tra nếu là economic contract và đang tạo mới (không phải update)
    if (formData.contract_type === 'economic' && !selectedOrder) {
      // Kiểm tra xem đã có export order nào với contract này chưa
      const existingOrder = orders.find(order => 
        order.contract_id._id === formData.contract_id && 
        order.status !== 'cancelled'
      );
      
      if (existingOrder) {
        setError(`Đã tồn tại export order với hợp đồng này ở trạng thái "${existingOrder.status}". Chỉ có thể tạo mới khi order cũ có trạng thái "cancelled".`);
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
      
      if (!detail.medicine_id || detail.expected_quantity <= 0 || detail.unit_price <= 0) {
        setError(trans.common.pleaseFillAllFields);
        setFormLoading(false);
        return;
      }
      
      const contractItem = contractMedicines.find((med) => med.medicine_id._id === detail.medicine_id);
      
      if (formData.contract_type === 'economic') {
        // Với economic contract, giữ nguyên validation cũ
        // Validate: số lượng nhập phải >= min_order_quantity từ hợp đồng
        if (contractItem && detail.expected_quantity < contractItem.min_order_quantity) {
          setError(
            `Số lượng xuất cho thuốc "${contractItem.medicine_id.medicine_name}" phải tối thiểu là ${contractItem.min_order_quantity}`
          );
          setFormLoading(false);
          return;
        }
        // Validate: số lượng nhập không vượt quá max_quantity hoặc 1000
        const maxQ = contractItem?.max_quantity || 1000;
        if (detail.expected_quantity > maxQ) {
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
        if (detail.expected_quantity < 1) {
          setError(`Số lượng xuất cho thuốc phải tối thiểu là 1`);
          setFormLoading(false);
          return;
        }
        // Validate: số lượng nhập không vượt quá 10000 (giới hạn cao hơn cho principal)
        if (detail.expected_quantity > 10000) {
          setError(`Số lượng xuất cho thuốc không được vượt quá 10,000`);
          setFormLoading(false);
          return;
        }
      }
    }
    
    // Kiểm tra tồn kho trước khi tạo export order
    const stockCheck = await checkStockAvailability(formData.details);
    
    if (!stockCheck.success) {
      const errorMsg = stockCheck.error || stockValidationError || '';
      setError(trans.common.stockCheckError.replace('{error}', errorMsg));
      setFormLoading(false);
      return;
    }

    if (!stockCheck.all_available) {
      const insufficientItems = stockCheck.insufficient_items || [];
      if (insufficientItems.length > 0) {
        const errorMessage = insufficientItems.map(item => 
          `"${item.medicine_name}" (${item.license_code}): Yêu cầu ${item.expected_quantity}, có sẵn ${item.available_quantity}`
        ).join('\n');
        
        setError(`Không đủ tồn kho cho các thuốc sau:\n${errorMessage}`);
      } else {
        setError(trans.common.insufficientStock);
      }
      setFormLoading(false);
      return;
    }

    setFormLoading(true);
    try {
      // Loại bỏ created_by và warehouse_manager_id nếu có trong formData
      const { created_by, warehouse_manager_id, ...payload } = formData;
      payload.details = payload.details.map((d) => ({
        medicine_id: d.medicine_id,
        expected_quantity: Number(d.expected_quantity),
        unit_price: Number(d.unit_price)
      }));

      let url, method;
      if (selectedOrder) {
        url = `${API_BASE_URL}/api/export-orders/${selectedOrder._id}`;
        method = 'patch'; // PATCH cho update
      } else {
        url = `${API_BASE_URL}/api/export-orders`;
        method = 'post';
      }

      const response = await axios({
        method,
        url,
        data: payload,
        headers: getAuthHeaders()
      });

      // Thông báo khác nhau cho create và update
      let successMessage = '';
      if (selectedOrder) {
        if (selectedOrder.status === 'rejected') {
          successMessage = trans.common.editingRejectedExportOrder;
        } else {
          successMessage = 'Export order updated successfully';
        }
      } else {
        successMessage = 'Export order created successfully';
      }

      setSuccess(successMessage);
      handleCloseForm();
      setOpenEditForm(false);
      setFormData({ contract_type: '', contract_id: '', details: [] });
      setSelectedOrder(null);
      setStockCheckResults([]); // Reset stock check results
      // Refresh table after create/update
      await fetchOrders();
    } catch (error) {
      console.error('❌ Error creating export order:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.error || error.response.data?.message || error.response.statusText;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{trans.common.exportOrders}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {trans.common.refresh}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenForm(true)}>
            {trans.common.createExportOrder}
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
                  <InputLabel>{trans.common.status}</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label={trans.common.status}
                  >
                    <MenuItem value="">{trans.common.allStatuses}</MenuItem>
                    <MenuItem value="draft">{trans.common.draft}</MenuItem>
                    <MenuItem value="approved">{trans.common.approved}</MenuItem>
                    <MenuItem value="rejected">{trans.common.rejected}</MenuItem>
                    <MenuItem value="completed">{trans.common.completed}</MenuItem>
                    <MenuItem value="returned">{trans.common.returned}</MenuItem>
                    <MenuItem value="cancelled">{trans.common.cancelled}</MenuItem>
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
              <TableCell>{trans.common.contract}</TableCell>
              <TableCell>{trans.common.contractType}</TableCell>
              <TableCell>{trans.common.status}</TableCell>
              <TableCell>{trans.common.createdBy}</TableCell>
              <TableCell>{trans.common.warehouseManager}</TableCell>
              <TableCell align="center">{trans.common.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography>{trans.common.loading}</Typography>
                </TableCell>
              </TableRow>
            ) : paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">{trans.common.noExportOrdersFound}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>{order.contract_id?.contract_code || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.contract_id?.contract_type === 'principal' ? trans.common.principalContract : trans.common.economicContract} 
                      color={order.contract_id?.contract_type === 'principal' ? 'primary' : 'secondary'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell><Chip label={order.status} color={getStatusColor(order.status)} size="small" /></TableCell>
                  <TableCell>{order.created_by?.email || 'N/A'}</TableCell>
                  <TableCell>{order.warehouse_manager_id?.email || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={(e) => handleActionMenuOpen(e, order)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
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
            <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 600 }}>
          {selectedOrder ? trans.common.editExportOrder : trans.common.createExportOrder}
          {selectedOrder ? (
            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 400 }}>
              {trans.common.editMedicinesOnly}
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
                    {contracts.filter(contract => {
                      if (!formData.contract_type) return true;
                      return contract.contract_type === formData.contract_type;
                    }).map((contract) => (
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
            </Grid>
            {/* Medicines List */}
            <Grid container spacing={2}>
              {formData.details.length === 0 && (!formData.contract_type || !formData.contract_id) && (
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
                            disabled={formData.contract_type === 'economic'}
                            sx={{ minWidth: 200, maxWidth: 240 }}
                          >
                            {contractMedicines.filter((med) =>
                              !formData.details.some((d, i) => d.medicine_id === med.medicine_id._id && i !== index)
                            ).map((med) => (
                              <MenuItem key={med.medicine_id._id} value={med.medicine_id._id}>
                                {med.medicine_id.medicine_name} - {med.medicine_id.license_code}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item sx={{ flex: '1 1 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label={trans.common.quantity}
                          type="text"
                          value={detail.expected_quantity ? detail.expected_quantity.toLocaleString() : ''}
                          onChange={(e) => {
                            // Remove all non-digit characters and convert to number
                            const rawValue = e.target.value.replace(/[^\d]/g, '');
                            const value = parseInt(rawValue) || 0;
                            // Prevent negative values
                            const validValue = Math.max(1, value);
                            handleDetailChange(index, 'expected_quantity', validValue);
                          }}
                          onBlur={(e) => {
                            // Format on blur if empty
                            if (!e.target.value) {
                              handleDetailChange(index, 'expected_quantity', 0);
                            }
                          }}
                          InputProps={{ 
                            min: 1,
                            inputMode: 'numeric',
                            pattern: '[0-9]*'
                          }}
                          required
                          disabled={!detail.medicine_id || formData.contract_type === 'economic'}
                          helperText={(() => {
                            const contractItem = contractMedicines.find((med) => med.medicine_id._id === detail.medicine_id);
                            if (contractItem) {
                              if (formData.contract_type === 'principal') {
                                return `Min: ${(contractItem.min_order_quantity || 1).toLocaleString()} (Có thể chỉnh sửa quantity)`;
                              } else {
                                return `Từ hợp đồng: ${(contractItem.quantity || contractItem.min_order_quantity || 1).toLocaleString()} (Economic - Không thể sửa)`;
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
                          onChange={(e) => {
                            // Remove all non-digit and non-decimal characters and convert to number
                            const rawValue = e.target.value.replace(/[^\d.,]/g, '');
                            const value = parseFloat(rawValue) || 0;
                            handleDetailChange(index, 'unit_price', value);
                          }}
                          onBlur={(e) => {
                            // Format on blur if empty
                            if (!e.target.value) {
                              handleDetailChange(index, 'unit_price', 0);
                            }
                          }}
                          InputProps={{
                            inputMode: 'decimal',
                            pattern: '[0-9]*[.,]?[0-9]*'
                          }}
                          required
                          disabled={!detail.medicine_id || formData.contract_type === 'economic'}
                          helperText={(() => {
                            if (formData.contract_type === 'economic') {
                              return trans.common.fromContractEconomicCannotEdit;
                            } else {
                              return trans.common.fromContractCannotEdit;
                            }
                          })()}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '1 1 0', minWidth: 120, maxWidth: 160 }}>
                        <TextField
                          fullWidth
                          label={trans.common.total}
                          value={(detail.expected_quantity * detail.unit_price).toLocaleString()}
                          InputProps={{ readOnly: true }}
                          sx={{ minWidth: 120, maxWidth: 140 }}
                        />
                      </Grid>
                      <Grid item sx={{ flex: '0 0 56px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <IconButton color="error" onClick={() => removeDetail(index)} disabled={formData.details.length === 1}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            {/* Add Medicine Button - Only show for Principal contracts */}
            {formData.contract_type !== 'economic' && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  onClick={addDetail} 
                  variant="outlined" 
                  size="medium" 
                  disabled={
                    !formData.contract_type || 
                    !formData.contract_id || 
                    (formData.contract_type === 'principal' && 
                     contractMedicines.length > 0 && 
                     formData.details.length >= contractMedicines.length)
                  } 
                  sx={{ minWidth: 140, fontWeight: 600 }}
                >
                  {selectedOrder ? 'Add Medicine' : (formData.contract_type === 'principal' ? 'Add Medicine (Quantity Only)' : 'Add Medicine')}
                </Button>
              </Box>
            )}



            {/* Stock Availability Information */}
            {formData.details.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
                  {trans.common.stockInformation}
                </Typography>
                
                {isCheckingStock && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                          <Box sx={{ mr: 1 }}>⏳</Box>
                    {trans.common.checkingStock}
                    </Box>
                  </Alert>
                )}

                {stockValidationError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>⚠️</Box>
                      {trans.common.stockCheckError.replace('{error}', stockValidationError)}
                    </Box>
                  </Alert>
                )}

                {/* Overall Validation Status */}
                {stockCheckResults.length > 0 && (
                  <Alert 
                    severity={stockCheckResults.every(r => r.is_available) ? 'success' : 'error'} 
                    sx={{ mb: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>
                        {stockCheckResults.every(r => r.is_available) ? '✅' : '❌'}
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {stockCheckResults.every(r => r.is_available) 
                          ? trans.common.sufficientStock
                          : trans.common.insufficientStock
                        }
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {stockCheckResults.length > 0 && (
                  <Grid container spacing={2}>
                    {stockCheckResults.map((result, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            border: '1px solid',
                            borderColor: result.is_available ? 'success.main' : 'error.main',
                            backgroundColor: result.is_available ? 'success.50' : 'error.50',
                            borderRadius: 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {result.is_available ? (
                              <Box sx={{ color: 'success.main', mr: 1 }}>✅</Box>
                            ) : (
                              <Box sx={{ color: 'error.main', mr: 1 }}>❌</Box>
                            )}
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {result.medicine_name}
                            </Typography>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {result.license_code}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">
                              Yêu cầu: <strong>{result.expected_quantity}</strong>
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: result.is_available ? 'success.main' : 'error.main',
                                fontWeight: 600
                              }}
                            >
                              Có sẵn: <strong>{result.available_quantity}</strong>
                            </Typography>
                          </Box>
                          
                          {!result.is_available && (
                            <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                              <Typography variant="caption">
                                Thiếu: {result.expected_quantity - result.available_quantity}
                              </Typography>
                            </Alert>
                          )}
                          
                          {/* Thông tin về batch còn hạn */}
                          {result.valid_batches && result.valid_batches.length > 0 && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', display: 'block', mb: 0.5 }}>
                                📦 Batch còn hạn: {result.total_valid_batches}
                              </Typography>
                              {result.valid_batches.slice(0, 2).map((batch, batchIndex) => (
                                <Typography key={batchIndex} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                  • {batch.batch_code}: Còn {batch.days_until_expiry} ngày
                                </Typography>
                              ))}
                              {result.valid_batches.length > 2 && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                  ...và {result.valid_batches.length - 2} batch khác
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}

                {/* Summary */}
                {stockCheckResults.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {trans.common.stockSummary}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={trans.common.totalMedicines.replace('{count}', stockCheckResults.length)} 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={trans.common.sufficientMedicines.replace('{count}', stockCheckResults.filter(r => r.is_available).length)} 
                        color="success" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={trans.common.insufficientMedicines.replace('{count}', stockCheckResults.filter(r => !r.is_available).length)} 
                        color="error" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Batch còn hạn: ${stockCheckResults.reduce((sum, r) => sum + (r.total_valid_batches || 0), 0)}`}
                        color="info" 
                        variant="outlined" 
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Total Amount bottom right */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 4, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {trans.common.totalAmount.replace('{amount}', formData.details.reduce((total, detail) => 
                  total + (detail.expected_quantity * detail.unit_price), 0
                ).toLocaleString())}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
          <Button onClick={handleCloseForm} disabled={formLoading || isCheckingStock} variant="outlined" sx={{ minWidth: 120 }}>
            {trans.common.cancel}
          </Button>
          <Button 
            onClick={(e) => {
              handleSubmit(e);
            }} 
            variant="contained" 
            disabled={formLoading || isCheckingStock || (stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available))} 
            sx={{ 
              minWidth: 120,
              bgcolor: stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available) ? 'error.main' : 'primary.main',
              '&:hover': {
                bgcolor: stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available) ? 'error.dark' : 'primary.dark'
              }
            }}
          >
            {formLoading ? trans.common.creating : 
             isCheckingStock ? trans.common.checkingStockButton : 
             stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available) ? trans.common.insufficientStockButton :
             trans.common.createOrder}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => handleViewDetails(selectedOrderForAction)}>
          <VisibilityIcon sx={{ mr: 1 }} />
          {trans.common.viewDetails}
        </MenuItem>
        {/* Chỉ hiển thị nút edit cho draft và rejected orders */}
        {selectedOrderForAction && (selectedOrderForAction.status === 'draft' || selectedOrderForAction.status === 'rejected') && (
          <MenuItem onClick={() => handleEditOrder(selectedOrderForAction)}>
            <EditIcon sx={{ mr: 1 }} />
            {trans.common.edit}
          </MenuItem>
        )}
        {/* Chỉ hiển thị nút delete cho draft và cancelled orders */}
        {selectedOrderForAction && (selectedOrderForAction.status === 'draft' || selectedOrderForAction.status === 'cancelled') && (
          <MenuItem onClick={() => handleDeleteOrder(selectedOrderForAction)}>
            <DeleteIcon sx={{ mr: 1 }} />
            {trans.common.delete}
          </MenuItem>
        )}
      </Menu>

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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography component="span">
                        <strong>Status:</strong>
                      </Typography>
                      <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status)} size="small" sx={{ ml: 1 }} />
                    </Box>
                    <Typography>
                      <strong>Created By:</strong> {selectedOrder.created_by?.email}
                    </Typography>
                    <Typography>
                      <strong>Warehouse Manager:</strong> {selectedOrder.warehouse_manager_id?.email}
                    </Typography>
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
                            <TableCell>{detail.medicine_id?.medicine_name || 'N/A'}</TableCell>
                            <TableCell align="right">{detail.expected_quantity}</TableCell>
                            <TableCell align="right">{detail.unit_price?.toLocaleString()} VND</TableCell>
                            <TableCell align="right">{((detail.expected_quantity || 0) * (detail.unit_price || 0)).toLocaleString()} VND</TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={openEditForm} onClose={handleCloseEditForm} maxWidth="md" fullWidth>
        <DialogTitle>{trans.common.editExportOrder}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel>{trans.common.contract}</InputLabel>
                  <Select
                    name="contract_id"
                    value={formData.contract_id}
                    onChange={handleFormChange}
                    label={trans.common.contract}
                    required
                    disabled
                  >
                {contracts.map((contract) => (
                  <MenuItem key={contract._id} value={contract._id}>
                    {contract.contract_code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{trans.common.orderDetailsTitle}</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
                              <Typography variant="body2">
                  {trans.common.pleaseFillAllFields}
                </Typography>
            </Alert>
            {formData.details.map((detail, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>{trans.common.medicine}</InputLabel>
                      <Select
                        value={detail.medicine_id}
                        onChange={(e) => handleDetailChange(index, 'medicine_id', e.target.value)}
                        label={trans.common.medicine}
                        required
                      >
                        {contractMedicines.map((med) => (
                          <MenuItem key={med.medicine_id._id} value={med.medicine_id._id}>
                            {med.medicine_id.medicine_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={trans.common.quantity}
                      type="text"
                      value={detail.expected_quantity ? detail.expected_quantity.toLocaleString() : ''}
                      onChange={(e) => {
                        // Remove all non-digit characters and convert to number
                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                        const value = parseInt(rawValue) || 0;
                        handleDetailChange(index, 'expected_quantity', value);
                      }}
                      onBlur={(e) => {
                        // Format on blur if empty
                        if (!e.target.value) {
                          handleDetailChange(index, 'expected_quantity', 0);
                        }
                      }}
                      fullWidth
                      required
                      disabled={formData.contract_type === 'economic'}
                      helperText={
                        formData.contract_type === 'economic' 
                          ? trans.common.economicContractAutoFilled
                          : trans.common.principalContractQuantityEditable
                      }
                      InputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
                      sx={{
                        '& .MuiFormHelperText-root': { fontSize: '0.75rem' },
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#666'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label={trans.common.unitPrice}
                      type="text"
                      value={detail.unit_price ? detail.unit_price.toLocaleString() : ''}
                      onChange={(e) => {
                        // Remove all non-digit and non-decimal characters and convert to number
                        const rawValue = e.target.value.replace(/[^\d.,]/g, '');
                        const value = parseFloat(rawValue) || 0;
                        handleDetailChange(index, 'unit_price', value);
                      }}
                      onBlur={(e) => {
                        // Format on blur if empty
                        if (!e.target.value) {
                          handleDetailChange(index, 'unit_price', 0);
                        }
                      }}
                      fullWidth
                      required
                      disabled={formData.contract_type === 'economic'}
                      helperText={
                        formData.contract_type === 'error' 
                          ? trans.common.economicContractAutoFilled
                          : trans.common.principalContractQuantityEditable
                      }
                      InputProps={{
                        inputMode: 'decimal',
                        pattern: '[0-9]*[.,]?[0-9]*'
                      }}
                      sx={{
                        '& .MuiFormHelperText-root': { fontSize: '0.75rem' },
                        '& .MuiInputBase-input.Mui-disabled': {
                          backgroundColor: '#f5f5f5',
                          color: '#666'
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      color="error"
                      onClick={() => removeDetail(index)}
                      disabled={formData.details.length === 1}
                      sx={{ mt: 1 }}
                    >
                      X
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button onClick={addDetail} sx={{ mt: 2 }}>{trans.common.addMedicine}</Button>
            
            {/* Stock Availability Information */}
            {stockCheckResults.length > 0 && (
              <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  🔍 Thông tin tồn kho
                  {isCheckingStock && <CircularProgress size={16} />}
                </Typography>
                
                {stockValidationError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Lỗi kiểm tra tồn kho: {stockValidationError}
                  </Alert>
                )}
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell><strong>Thuốc</strong></TableCell>
                        <TableCell align="right"><strong>Yêu cầu</strong></TableCell>
                        <TableCell align="right"><strong>Có sẵn</strong></TableCell>
                        <TableCell align="center"><strong>Trạng thái</strong></TableCell>
                        <TableCell><strong>Batch còn hạn</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stockCheckResults.map((result, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2">
                              <strong>{result.medicine_name}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {result.license_code}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{result.expected_quantity}</TableCell>
                          <TableCell align="right">{result.available_quantity}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={result.is_available ? `✅ ${trans.common.sufficient}` : `❌ ${trans.common.insufficient}`}
                              color={result.is_available ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {result.valid_batches && result.valid_batches.length > 0 ? (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main' }}>
                                  {result.total_valid_batches} batch
                                </Typography>
                                {result.valid_batches.slice(0, 2).map((batch, batchIndex) => (
                                  <Typography key={batchIndex} variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                    • {batch.batch_code}: {batch.days_until_expiry} ngày
                                  </Typography>
                                ))}
                                {result.valid_batches.length > 2 && (
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                    +{result.valid_batches.length - 2} khác
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="caption" color="error.main">
                                Không có batch còn hạn
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Tổng: {stockCheckResults.length} loại thuốc | 
                    Đủ: {stockCheckResults.filter(r => r.is_available).length} | 
                    Thiếu: {stockCheckResults.filter(r => !r.is_available).length} |
                    Batch còn hạn: {stockCheckResults.reduce((sum, r) => sum + (r.total_valid_batches || 0), 0)}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => checkStockAvailability(formData.details)}
                    disabled={isCheckingStock}
                    startIcon={<SearchIcon />}
                  >
                    🔍 Kiểm tra lại
                  </Button>
                </Box>
              </Box>
            )}
            
            <DialogActions>
              <Button onClick={handleCloseEditForm} disabled={formLoading}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={
                  formLoading || 
                  isCheckingStock || 
                  (stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available))
                }
              >
                {formLoading ? 'Saving...' : 
                 isCheckingStock ? 'Checking Stock...' :
                 stockCheckResults.length > 0 && !stockCheckResults.every(r => r.is_available) ? 'Insufficient Stock' :
                 'Update'
                }
              </Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default ExportOrderPage; 