'use client';
import React, { useState, useEffect } from 'react';
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
  Restore as RestoreIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useRole } from '@/contexts/RoleContext';
import useTrans from '@/hooks/useTrans';
import EconomicContractEditDialog from './EconomicContractEditDialog'; // Import the edit dialog component
import ContractAddDialog from './ContractAddDialog'; // Import the new unified add dialog component
import StatusActionDialog from './StatusActionDialog';
import PrincipalContractEditDialog from './PrincipalContractEditDialog'; // Import the unified principal contract dialog
import AnnexDialog from './AnnexDialog'; // Import the annex dialog component

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

const ContractManagement = () => {
  const trans = useTrans();
  const { userRole, user, isLoading } = useRole();
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    contract_code: '',
    status: '',
    partner_type: '',
    contract_type: ''
  });

  // Add applied filters state to separate current filters from applied ones
  const [appliedFilters, setAppliedFilters] = useState({
    contract_code: '',
    status: '',
    partner_type: '',
    contract_type: ''
  });

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    partner_type: [],
    contract_type: []
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

  // Annex dialog states
  const [openAnnexDialog, setOpenAnnexDialog] = useState(false);
  const [annexMode, setAnnexMode] = useState('create');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch contracts
  const fetchContracts = async () => {
    // Don't fetch if role context is still loading
    if (isLoading) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(Object.entries(appliedFilters).filter(([_, value]) => value !== ''))
      });

      if (userRole === 'representative' && user) {
        const userId = user.userId ?? user.id;
        if (userId) {
          params.append('created_by', userId);
        }
      }
      const response = await axiosInstance.get(`/api/contract?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setContracts(response.data.data.contracts);
        setFilterOptions(response.data.filterOptions);
        setTotalCount(response.data.data.pagination.total);
      }
    } catch (error) {
      setError(trans.common.errorOccurred);
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
        setSuppliers(response.data.data); // Data from API, only contains _id and name
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
        setRetailers(response.data.data); // Data from API, only contains _id and name
      }
    } catch (error) {
      console.error('Error fetching retailers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle add contract success
  const handleAddContractSuccess = () => {
    setSuccess(trans.common.addContractSuccess);
    fetchContracts(); // Refresh the list
  };

  // Handle update contract success
  const handleUpdateContractSuccess = () => {
    setSuccess(trans.common.updateContractSuccess);
    fetchContracts(); // Refresh the list
  };

  // Delete contract
  const handleDeleteContract = async () => {
    setOpenActionDialog(false);
    // setOpenDeleteDialog(false);
    setSelectedContract(null);
    try {
      const response = await axiosInstance.delete(`/api/contract/${selectedContract._id}`, {
        headers: getAuthHeaders()
      });

      if (response.data.success) {
        setSuccess(trans.common.deleteContractSuccess);
        fetchContracts();
      }
    } catch (error) {
      setError(error.response?.data?.message || trans.common.errorOccurred);
    }
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    // Remove auto page reset - only reset when applying filters
  };

  // Apply filters when search button is clicked
  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(0); // Reset to first page when applying new filters
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      contract_code: '',
      status: '',
      partner_type: '',
      contract_type: ''
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
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

  // Open dialog for each action
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

  // Common handler for all actions
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
        `/api/contract/${selectedContract._id}/status`,
        { status: newStatus },
        { headers: getAuthHeaders() }
      );
      if (response.data.success) {
        const actionMessages = {
          confirm: trans.common.confirmAction,
          reject: trans.common.cancel,
          cancel: trans.common.cancel,
          draft: trans.common.cancel
        };

        setSuccess(`${actionMessages[actionType]} ${trans.common.updateContractSuccess}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || trans.common.errorOccurred);
    } finally {
      setActionLoading(false);
      setOpenActionDialog(false);
      setSelectedContract(null);
      fetchContracts();
    }
  };

  // Annex handlers
  const handleOpenAnnexDialog = (contract) => {
    setSelectedContract(contract);
    setOpenAnnexDialog(true);
  };

  const handleAnnexSuccess = () => {
    setOpenAnnexDialog(false);
    setSelectedContract(null);
    setSuccess(trans.common.annexActionSuccess);
    fetchContracts();
  };

  useEffect(() => {
    if (!isLoading) {
      fetchSuppliers();
      fetchRetailers();
      // Only fetch contracts on initial load when role context is ready
      if (userRole) {
        fetchContracts();
      }
    }
  }, [isLoading, userRole]);

  useEffect(() => {
    fetchContracts();
  }, [page, rowsPerPage, appliedFilters]); // Use appliedFilters instead of filters

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

  if (isLoading) return <div>{trans.common.loading || 'Loading...'}</div>; // or spinner

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
          {trans.common.contractManagement}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {trans.common.manageContractList}
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
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <FilterIcon sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {trans.representativeManagerImportOrders.filters.title}
            </Typography>
          </Box>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label={trans.common.contractCode}
                value={filters.contract_code}
                onChange={(e) => handleFilterChange('contract_code', e.target.value)}
                variant="outlined"
                size="small"
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
              <FormControl fullWidth size="small" sx={{ maxWidth: 150 }}>
                <InputLabel>{trans.common.contractType}</InputLabel>
                <Select
                  value={filters.contract_type}
                  onChange={(e) => handleFilterChange('contract_type', e.target.value)}
                  label={trans.common.contractType}
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
                        {selected === 'economic'
                          ? trans.common.economicContract
                          : selected === 'principal'
                            ? trans.common.principalContract
                            : selected || trans.common.all}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 150
                  }}
                >
                  <MenuItem value="">{trans.common.all}</MenuItem>
                  {filterOptions?.contract_type?.map((type) => (
                    <MenuItem key={type} value={type} title={type}>
                      {type === 'economic' ? trans.common.economicContract : type === 'principal' ? trans.common.principalContract : type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={{ maxWidth: 150 }}>
                <InputLabel>{trans.common.partnerType}</InputLabel>
                <Select
                  value={filters.partner_type}
                  onChange={(e) => handleFilterChange('partner_type', e.target.value)}
                  label={trans.common.partnerType}
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
                        {selected || trans.common.all}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 150
                  }}
                >
                  <MenuItem value="">{trans.common.all}</MenuItem>
                  {filterOptions?.partner_type?.map((type) => (
                    <MenuItem key={type} value={type} title={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size="small" sx={{ maxWidth: 150 }}>
                <InputLabel>{trans.common.status}</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label={trans.common.status}
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
                        {selected || trans.common.all}
                      </span>
                    </Tooltip>
                  )}
                  sx={{
                    width: 150
                  }}
                >
                  <MenuItem value="">{trans.common.all}</MenuItem>
                  {filterOptions?.status?.map((sta) => (
                    <MenuItem key={sta} value={sta} title={sta}>
                      {sta}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button variant="contained" onClick={applyFilters} fullWidth size="small" startIcon={<SearchIcon />}>
                {trans.common.search || 'Search'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={1}>
              <Button variant="outlined" size="small" onClick={clearFilters} fullWidth>
                {trans.common.clear || 'Clear'}
              </Button>
            </Grid>
            {userRole === 'representative' && (
              <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end', ml: 'auto' }}>
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
                  {trans.common.addContract}
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
            {trans.common.contractManagement}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {trans.common.manageContractList} {totalCount}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.contractCode}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.contractType}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.createdBy}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.partner}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{trans.common.status}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {trans.common.actions}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract._id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{contract.contract_code}</TableCell>
                  <TableCell>
                    <Chip
                      label={contract.contract_type === 'economic' ? trans.common.economicContract : trans.common.principalContract}
                      size="small"
                      variant="outlined"
                      color={contract.contract_type === 'economic' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={contract.created_by.email} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell
                    sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={contract.partner_type + ' - ' + (contract.partner_id?.name || trans.common.na)}
                  >
                    <Chip
                      label={contract.partner_type + ' - ' + (contract.partner_id?.name || trans.common.na)}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{contract.status}</TableCell>
                  <TableCell align="left">
                    {userRole === 'representative' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                        <Tooltip title={trans.common.viewDetails}>
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
                        {contract.status === 'rejected' && (
                          <Tooltip title={trans.common.draftAction}>
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

                        {/* Annex action for principal contracts with active status */}
                        {contract.contract_type === 'principal' && contract.status === 'active' && (
                          <Tooltip title={trans.common.annex}>
                            <IconButton
                              color="info"
                              size="small"
                              onClick={async () => {
                                // Find existing annex that can be edited (draft or rejected)
                                const existingAnnex = contract.annexes?.find(
                                  (annex) => annex.status === 'draft' || annex.status === 'rejected'
                                );

                                // Force refresh data to ensure sync
                                await fetchContracts();

                                // Let AnnexDialog handle the logic based on fresh data
                                handleOpenAnnexDialog(contract);
                              }}
                              sx={{
                                bgcolor: 'info.50',
                                '&:hover': { bgcolor: 'info.100' }
                              }}
                            >
                              <AttachFileIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {(contract.status === 'draft' || contract.status === 'rejected') && (
                          <>
                            <Tooltip title={trans.common.edit}>
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

                            <Tooltip title={trans.common.deleteContract}>
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
                      </Box>
                    )}
                    {userRole === 'representative_manager' && (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                        <Tooltip title={trans.common.viewDetails}>
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
                            <Tooltip title={trans.common.confirmAction}>
                              <IconButton color="success" size="small" onClick={() => openConfirmDialog(contract)}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title={trans.common.reject}>
                              <IconButton color="warning" size="small" onClick={() => openRejectDialog(contract)}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {contract.status === 'active' && (
                          <Tooltip title={trans.common.cancelContract}>
                            <IconButton color="secondary" size="small" onClick={() => openCancelDialog(contract)}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Annex action for representative_manager - only show if there's a draft annex */}
                        {contract.contract_type === 'principal' &&
                          contract.status === 'active' &&
                          contract.annexes?.some((annex) => annex.status === 'draft') && (
                            <Tooltip title={trans.common.approveAnnex}>
                              <IconButton
                                color="info"
                                size="small"
                                onClick={() => {
                                  handleOpenAnnexDialog(contract);
                                }}
                                sx={{
                                  bgcolor: 'info.50',
                                  '&:hover': { bgcolor: 'info.100' }
                                }}
                              >
                                <AttachFileIcon fontSize="small" />
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
          sx={{
            borderTop: '1px solid #e0e0e0',
            bgcolor: 'grey.50'
          }}
        />
      </Card>

      {/* Dialogs */}
      <ContractAddDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        onSuccess={handleAddContractSuccess}
        suppliers={suppliers}
        retailers={retailers}
      />

      {/* View Dialog - Economic Contract */}
      {selectedContract && selectedContract.contract_type === 'economic' && (
        <EconomicContractEditDialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          contract={selectedContract}
          suppliers={suppliers}
          retailers={retailers}
          isViewMode={true}
        />
      )}

      {/* View Dialog - Principal Contract */}
      {selectedContract && selectedContract.contract_type === 'principal' && (
        <PrincipalContractEditDialog
          open={openViewDialog}
          onClose={() => setOpenViewDialog(false)}
          contract={selectedContract}
          suppliers={suppliers}
          retailers={retailers}
          isViewMode={true}
        />
      )}

      {/* Edit Dialog - Economic Contract */}
      {selectedContract && selectedContract.contract_type === 'economic' && (
        <EconomicContractEditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          contract={selectedContract}
          suppliers={suppliers}
          retailers={retailers}
          onSuccess={handleUpdateContractSuccess}
        />
      )}

      {/* Edit Dialog - Principal Contract */}
      {selectedContract && selectedContract.contract_type === 'principal' && (
        <PrincipalContractEditDialog
          open={openEditDialog}
          onClose={() => setOpenEditDialog(false)}
          contract={selectedContract}
          suppliers={suppliers}
          retailers={retailers}
          onSuccess={handleUpdateContractSuccess}
        />
      )}

      {/* Status Action Dialog */}
      <StatusActionDialog
        open={openActionDialog}
        onClose={() => setOpenActionDialog(false)}
        actionType={actionType}
        contract={selectedContract}
        onConfirm={handleStatusAction}
        loading={actionLoading}
      />

      {/* Annex Dialog */}
      <AnnexDialog
        open={openAnnexDialog}
        onClose={() => setOpenAnnexDialog(false)}
        contractId={selectedContract?._id}
        onSuccess={handleAnnexSuccess}
      />
    </Box>
  );
};

export default ContractManagement;
