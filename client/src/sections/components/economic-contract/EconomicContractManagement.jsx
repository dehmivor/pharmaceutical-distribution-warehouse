'use client';
import React, { useState, useEffect, use } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Alert,
  Card,
  CardContent,
  InputAdornment,
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Block as BlockIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRole } from '@/contexts/RoleContext';
import EconomicContractEditDialog from './EconomicContractEditDialog'; // Import the edit dialog component
import EconomicContractAddDialog from './EconomicContractAddDialog'; // Import the add dialog component
import StatusActionDialog from './StatusActionDialog';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

const EconomicContractManagement = () => {
  const { userRole, user, isLoading } = useRole();
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    contract_code: '',
    status: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: []
  });

  // Dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  // const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch contracts
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== ''))
      });

      if (userRole === 'representative') {
        params.append('created_by', user.userId ?? user.id); //TODO : fix bug /auth/me + permissions
      }
      const response = await axiosInstance.get(`/api/economic-contracts?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError('Lỗi khi tải danh sách thuốc');
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/supplier/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setSuppliers(response.data.data); // Dữ liệu từ API, chỉ chứa _id và name
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch retailers
  const fetchRetailers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/retailer/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setRetailers(response.data.data); // Dữ liệu từ API, chỉ chứa _id và name
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicines
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/medicine/all/v1', {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setMedicines(response.data.data); // Dữ liệu từ API, chỉ chứa _id và license_code
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await axiosInstance.get(`/api/economic-contracts/filter-options`, {
        headers: getAuthHeaders()
      });
      if (response.data.success) {
        setFilterOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Handle add contract success
  const handleAddContractSuccess = () => {
    setSuccess('Thêm hợp đồng mới thành công');
    fetchContracts(); // Refresh the list
  };

  // Handle update contract success
  const handleUpdateContractSuccess = () => {
    setSuccess('Cập nhật hợp đồng thành công');
    fetchContracts(); // Refresh the list
  };

  // Delete contract
  const handleDeleteContract = async () => {
    setOpenActionDialog(false);
    // setOpenDeleteDialog(false);
    setSelectedContract(null);
    try {
      const response = await axiosInstance.delete(`/api/economic-contracts/${selectedContract._id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSuccess('Xóa hợp đồng thành công');
        fetchContracts();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Lỗi khi xóa hợp đồng');
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Mở dialog cho từng action
  const openConfirmDialog = (contract) => {
    setSelectedContract(contract);
    setActionType('confirm');
    setOpenActionDialog(true);
  };

  const openRejectDialog = (contract) => {
    setSelectedContract(contract);
    setActionType('reject');
    setOpenActionDialog(true);
  };

  const openCancelDialog = (contract) => {
    setSelectedContract(contract);
    setActionType('cancel');
    setOpenActionDialog(true);
  };

  const openDeleteDialog = (contract) => {
    setSelectedContract(contract);
    setActionType('delete');
    setOpenActionDialog(true);
  };

  const openDraftDialog = (contract) => {
    setSelectedContract(contract);
    setActionType('draft');
    setOpenActionDialog(true);
  };

  // Handler chung cho tất cả actions
  const handleStatusAction = async () => {
    if (!selectedContract || !actionType) return;

    setActionLoading(true);
    try {
      let newStatus = '';
      switch (actionType) {
        case 'confirm':
          newStatus = 'active';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        case 'cancel':
          newStatus = 'cancelled';
          break;
        case 'draft':
          newStatus = 'draft';
          break;
        case 'delete':
          // Handle delete separately
          await handleDeleteContract();
          return;
      }

      const response = await axiosInstance.put(
        `/api/economic-contracts/${selectedContract._id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        const actionMessages = {
          confirm: 'Xác nhận',
          reject: 'Từ chối',
          cancel: 'Hủy',
          draft: 'Chuyển về nháp'
        };

        setSuccess(`${actionMessages[actionType]} hợp đồng thành công`);
        setOpenActionDialog(false);
        setSelectedContract(null);
        fetchContracts();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      console.log('Role', userRole);
      if (userRole === 'representative') {
        fetchFilterOptions();
        fetchSuppliers();
        // fetchRetailers();
        fetchMedicines();
      }
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [page, rowsPerPage, filters]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (isLoading) return <div>Loading...</div>; // hoặc spinner

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          Quản Lý Hợp đồng Kinh tế
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quản lý danh sách hợp đồng và thông tin chi tiết
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Bộ Lọc Tìm Kiếm
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Mã hợp đồng"
                value={filters.license_code}
                onChange={(e) => handleFilterChange('contract_code', e.target.value)}
                variant="outlined"
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 150 }}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Trạng thái"
                  renderValue={(selected) => (
                    <Tooltip title={selected}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {selected || 'Tất cả'}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 150
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.status?.map((sta) => (
                    <MenuItem key={sta} value={sta} title={sta}>
                      {sta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="medium" sx={{ maxWidth: 150 }}>
                <InputLabel>Loại đối tác</InputLabel>
                <Select
                  value={filters.partner_type}
                  onChange={(e) => handleFilterChange('partner_type', e.target.value)}
                  label="Loại đối tác"
                  renderValue={(selected) => (
                    <Tooltip title={selected}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {selected || 'Tất cả'}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 150
                  }}
                >
                  <MenuItem value="">Tất cả</MenuItem>
                  {filterOptions?.partner_type?.map((type) => (
                    <MenuItem key={type} value={type} title={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {userRole === 'representative' && (
              <Grid item xs={12} sm={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', ml: 'auto' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{
                    bgcolor: 'success.main',
                    '&:hover': {
                      bgcolor: 'success.dark'
                    },
                    px: 3,
                    py: 1.2,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Thêm hợp đồng
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ border: '1px solid #e0e0e0' }}>
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Danh Sách Hợp Đồng
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Tổng cộng {totalCount} hợp đồng
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Mã hợp đồng</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Người tạo</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Đối tác</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  Hành động
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{contract.contract_code}</TableCell>
                  <TableCell>
                    <Chip label={contract.created_by.email} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell
                    sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={contract.partner_type + ' - ' + contract.partner_id.name}
                  >
                    <Chip
                      label={contract.partner_type + ' - ' + contract.partner_id.name}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{contract.status}</TableCell>
                  <TableCell align="left">
                    {userRole === 'representative' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedContract(contract);
                              setOpenViewDialog(true);
                            }}
                            sx={{
                              bgcolor: 'primary.50',
                              '&:hover': { bgcolor: 'primary.100' }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {(contract.status === 'draft' || contract.status === 'rejected') && (
                          <>
                            <Tooltip title="Chỉnh sửa">
                              <IconButton
                                color="secondary"
                                size="small"
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setOpenEditDialog(true);
                                }}
                                sx={{
                                  bgcolor: 'secondary.50',
                                  '&:hover': { bgcolor: 'secondary.100' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Xóa">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  openDeleteDialog(contract);
                                }}
                                sx={{
                                  bgcolor: 'error.50',
                                  '&:hover': { bgcolor: 'error.100' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {contract.status === 'rejected' && (
                          <Tooltip title="Chuyển về nháp">
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => openDraftDialog(contract)}
                              sx={{
                                bgcolor: 'primary.50',
                                '&:hover': { bgcolor: 'primary.100' }
                              }}
                            >
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                    {userRole === 'supervisor' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedContract(contract);
                              setOpenViewDialog(true);
                            }}
                            sx={{
                              bgcolor: 'primary.50',
                              '&:hover': { bgcolor: 'primary.100' }
                            }}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {contract.status === 'draft' && (
                          <>
                            <Tooltip title="Xác nhận">
                              <IconButton color="success" size="small" onClick={() => openConfirmDialog(contract)}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Từ chối">
                              <IconButton color="warning" size="small" onClick={() => openRejectDialog(contract)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {contract.status === 'active' && (
                          <Tooltip title="Hủy hợp đồng">
                            <IconButton color="secondary" size="small" onClick={() => openCancelDialog(contract)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Số hàng mỗi trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>

      <EconomicContractEditDialog
        open={openEditDialog}
        onClose={() => {
          setOpenEditDialog(false);
        }}
        contract={selectedContract}
        onSuccess={handleUpdateContractSuccess}
        suppliers={suppliers}
        retailers={retailers}
        medicines={medicines}
      />

      <EconomicContractEditDialog
        open={openViewDialog}
        onClose={() => {
          setOpenViewDialog(false);
        }}
        contract={selectedContract}
        suppliers={suppliers}
        retailers={retailers}
        medicines={medicines}
        viewDetail={true}
      />

      <EconomicContractAddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddContractSuccess}
        suppliers={suppliers}
        retailers={retailers}
        medicines={medicines}
      />

      <StatusActionDialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
        onConfirm={handleStatusAction}
        contract={selectedContract}
        actionType={actionType}
        loading={actionLoading}
      />
    </Box>
  );
};

export default EconomicContractManagement;
