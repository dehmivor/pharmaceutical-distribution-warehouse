'use client';

import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Skeleton,
  Button,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Paper,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Search as SearchIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import useTrans from '@/hooks/useTrans';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CheckInspections() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const trans = useTrans();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const [loading, setLoading] = useState(true);
  const [checkBy, setCheckBy] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});

  // Pagination states for each accordion
  const [uncheckedPage, setUncheckedPage] = useState(0);
  const [checkedPage, setCheckedPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  const { checkOrderId } = useParams();

  const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Lấy user kiểm kê
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setCheckBy(userObj.userId || null);
      } catch (e) {
        console.error('Error parsing user from localStorage', e);
        setCheckBy(null);
      }
    }
  }, []);

  // Load danh sách vị trí kho 1 lần
  useEffect(() => {
    axios
      .get(`${backendUrl}/api/locations`, { headers: getAuthHeaders() })
      .then((res) => setLocationsList(res.data))
      .catch((error) => {
        console.error('Failed to load locations:', error);
        enqueueSnackbar('Không thể tải dữ liệu vị trí kho.', { variant: 'error' });
      });
  }, []);

  // Hàm fetch đơn kiểm kê chi tiết
  const fetchOrderDetail = async () => {
    if (!checkOrderId) return null;
    try {
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.success && res.data.data) {
        setOrderData(res.data.data.checkorder);
        if (Array.isArray(res.data.data.checkorder.items)) {
          const items = res.data.data.checkorder.items.map((item) => ({
            id: item.medicine_id._id,
            name: item.medicine_id.medicine_name,
            stock: item.stock
          }));
          setInventoryItems(items);
        }
        return res.data.data.checkorder;
      } else {
        enqueueSnackbar('Không lấy được dữ liệu đơn kiểm kê.', { variant: 'error' });
        return null;
      }
    } catch (error) {
      console.error('Failed to load check order:', error);
      enqueueSnackbar('Lỗi tải đơn kiểm kê.', { variant: 'error' });
      return null;
    }
  };

  // Hàm fetch phiếu kiểm kê chi tiết
  const fetchInspections = async (pageParam = 0, rowsPerPageParam = rowsPerPage) => {
    if (!checkOrderId) return;
    setLoading(true);
    const params = {
      page: pageParam + 1,
      limit: rowsPerPageParam
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (filterLocation) params.location = filterLocation;
    if (filterDate) params.date = filterDate;
    if (filterStatus) params.status = filterStatus;
    if (sortDirection) params.sort = sortDirection;

    try {
      const res = await axios.get(`${backendUrl}/api/inventory/inspection-from-order/${checkOrderId}`, {
        headers: getAuthHeaders(),
        params
      });
      const inspectionsData = res.data?.data || [];
      const total = res.data?.totalCount ?? inspectionsData.length;
      setTotalCount(total);

      if (Array.isArray(inspectionsData)) {
        const processedInspections = inspectionsData.map((inspection) => ({
          _id: inspection._id,
          inventory_check_order_id: inspection.inventory_check_order_id?._id || inspection.inventory_check_order_id,
          status: inspection.status,
          location_id: inspection.location_id,
          notes: inspection.notes,
          check_by: inspection.check_by,
          date: inspection.createdAt || inspection.updatedAt || null,
          check_list: inspection.check_list || []
        }));
        setInspections(processedInspections);

        const uniqueUserIds = [...new Set(processedInspections.map((i) => i.check_by?._id || i.check_by).filter(Boolean))];
        if (uniqueUserIds.length > 0) {
          try {
            const userRes = await axios.get(`${backendUrl}/api/users`, {
              params: { ids: uniqueUserIds.join(',') },
              headers: getAuthHeaders()
            });

            let usersArray = [];
            if (Array.isArray(userRes.data)) {
              usersArray = userRes.data;
            } else if (userRes.data && Array.isArray(userRes.data.data)) {
              usersArray = userRes.data.data;
            }

            const userMapNew = {};
            usersArray.forEach((user) => {
              userMapNew[user._id] = user;
            });
            setUsersMap(userMapNew);
          } catch (error) {
            console.error('Failed to fetch users info', error);
            setUsersMap({});
          }
        } else {
          setUsersMap({});
        }
      } else {
        setInspections([]);
        setUsersMap({});
        enqueueSnackbar('Dữ liệu phiếu kiểm kê không đúng định dạng.', { variant: 'error' });
      }
    } catch (error) {
      if (error.response?.status === 404) {
        enqueueSnackbar('Không tìm thấy dữ liệu kiểm kê cho đơn này.', { variant: 'warning' });
      } else {
        enqueueSnackbar('Không thể tải dữ liệu phiếu kiểm kê.', { variant: 'error' });
      }
      setInspections([]);
      setUsersMap({});
      setTotalCount(0);
      console.error('Error fetching inspections', error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý tuần tự fetch đổi trạng thái lên 'processing', tạo phiếu, rồi lấy lại detail
  const processCheckOrderAndCreateInspections = async () => {
    if (!checkOrderId || !checkBy) return;
    setLoading(true);
    try {
      // 1. Fetch detail đơn kiểm kê
      const order = await fetchOrderDetail();
      if (!order) {
        setLoading(false);
        return;
      }

      // 2. Nếu trạng thái chưa processing, update status
      if (order.status?.toLowerCase() !== 'processing' && order.status?.toLowerCase() === 'pending') {
        const updateRes = await axios.patch(
          `${backendUrl}/api/inventory/check-order/${checkOrderId}`,
          { status: 'processing' },
          { headers: getAuthHeaders() }
        );

        if (!updateRes.data?.success || !updateRes.data.updated) {
          enqueueSnackbar(updateRes.data?.message || 'Không thể cập nhật trạng thái đơn kiểm kê.', { variant: 'error' });
          setLoading(false);
          return;
        }
      }

      // 3. Tạo phiếu kiểm kê chi tiết
      const createRes = await axios.post(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {}, { headers: getAuthHeaders() });

      enqueueSnackbar(createRes.data?.message || 'Đã tạo phiếu kiểm kê cho tất cả vị trí.', {
        variant: createRes.data?.success ? 'success' : 'info'
      });

      // 4. Fetch lại danh sách phiếu kiểm kê chi tiết
      await fetchInspections(0, rowsPerPage);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Lỗi xử lý phiếu kiểm kê.', { variant: 'error' });
      console.error('Lỗi xử lý phiếu kiểm kê:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động chạy khi có checkOrderId và checkBy (userId)
  useEffect(() => {
    if (checkOrderId && checkBy) {
      processCheckOrderAndCreateInspections();
    }
  }, [checkOrderId, checkBy]);

  // Các hàm UI
  const handleFilterChange = (field, value) => {
    switch (field) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'location':
        setFilterLocation(value);
        break;
      case 'date':
        setFilterDate(value);
        break;
      case 'status':
        setFilterStatus(value);
        break;
      default:
        break;
    }
  };

  const handleSearchClick = () => {
    setUncheckedPage(0);
    setCheckedPage(0);
    fetchInspections(0, rowsPerPage);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterDate('');
    setFilterStatus('');
    setSortDirection('asc');
    setUncheckedPage(0);
    setCheckedPage(0);
    fetchInspections(0, rowsPerPage);
  };

  const handleChangePage = (event, newPage, type) => {
    if (type === 'unchecked') {
      setUncheckedPage(newPage);
    } else {
      setCheckedPage(newPage);
    }
    fetchInspections(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRpp = parseInt(event.target.value, 10);
    setRowsPerPage(newRpp);
    setUncheckedPage(0);
    setCheckedPage(0);
    fetchInspections(0, newRpp);
  };

  const getLocationLabel = (location) => {
    if (!location) return '';
    const areaName = location.area_id?.name || 'Không xác định';
    return `Khu vực: ${areaName}, Bay: ${location.bay}, Row: ${location.row}, Column: ${location.column}`;
  };

  // Hàm nhóm phiếu kiểm kê theo location (giữ nguyên logic)
  const groupInspectionsByLocation = (inspections) => {
    const map = new Map();
    inspections.forEach((insp) => {
      const loc = insp.location_id;
      if (!loc) return;
      const key = `${loc.area_id?.name || 'Không xác định'}|${loc.bay}|${loc.row}|${loc.column}`;
      if (!map.has(key)) {
        map.set(key, {
          location: loc,
          status: insp.status,
          notes: insp.notes,
          check_list: [...(insp.check_list || [])],
          _ids: [insp._id]
        });
      } else {
        const existing = map.get(key);
        const itemMap = new Map();
        existing.check_list.forEach((item) => {
          const itemKey = item.package_id?._id || item._id;
          if (itemKey) {
            itemMap.set(itemKey, item);
          }
        });
        (insp.check_list || []).forEach((item) => {
          const itemKey = item.package_id?._id || item._id;
          if (itemKey && !itemMap.has(itemKey)) {
            itemMap.set(itemKey, item);
          }
        });
        existing.check_list = Array.from(itemMap.values());
        existing._ids.push(insp._id);
      }
    });
    return Array.from(map.values());
  };

  const groupedInspections = groupInspectionsByLocation(inspections);

  const uncheckedInspections = groupedInspections.filter(
    (insp) => !insp.check_list || insp.check_list.length === 0 || insp.check_list.every((item) => item.actual_quantity === 0)
  );

  const checkedInspections = groupedInspections.filter(
    (insp) => insp.check_list && insp.check_list.some((item) => item.actual_quantity > 0)
  );

  // Pagination for unchecked inspections
  const uncheckedStartIndex = uncheckedPage * rowsPerPage;
  const uncheckedEndIndex = uncheckedStartIndex + rowsPerPage;
  const paginatedUncheckedInspections = uncheckedInspections.slice(uncheckedStartIndex, uncheckedEndIndex);

  // Pagination for checked inspections
  const checkedStartIndex = checkedPage * rowsPerPage;
  const checkedEndIndex = checkedStartIndex + rowsPerPage;
  const paginatedCheckedInspections = checkedInspections.slice(checkedStartIndex, checkedEndIndex);

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans.checkInspections.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {trans.checkInspections.description}
          </Typography>
        </Box>
      </Box>

      {orderData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {trans.checkInspections.checkOrderInfo}: <strong>{orderData._id}</strong>
          </Typography>
          <Typography variant="body2">
            {trans.checkInspections.warehouseManager}: {orderData.warehouse_manager_id.email} | {trans.checkInspections.createdBy}:{' '}
            {orderData.created_by?.email || '-'} | {trans.checkInspections.checkDate}:{' '}
            {orderData.inventory_check_date ? new Date(orderData.inventory_check_date).toLocaleDateString('vi-VN') : '-'} |{' '}
            {trans.checkInspections.status}:{' '}
            {orderData.status === 'pending'
              ? trans.checkInspections.notStarted
              : orderData.status === 'processing'
                ? trans.checkInspections.inProgress
                : orderData.status === 'completed'
                  ? trans.checkInspections.completed
                  : orderData.status}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {trans.checkInspections.notes}: {orderData.notes || '-'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
            {trans.checkOrders.createdAt}: {orderData.createdAt ? new Date(orderData.createdAt).toLocaleString('vi-VN') : '-'} |{' '}
            {trans.checkOrders.updatedAt}: {orderData.updatedAt ? new Date(orderData.updatedAt).toLocaleString('vi-VN') : '-'}
          </Typography>
        </Alert>
      )}

      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={trans.checkInspections.search}
            placeholder={trans.checkInspections.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />

          <TextField
            fullWidth
            select
            label={trans.checkInspections.warehouseLocation}
            value={filterLocation}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            size="small"
          >
            <MenuItem value="">{trans.checkInspections.allLocations}</MenuItem>
            {locationsList.map((loc) => (
              <MenuItem key={loc._id} value={loc._id}>
                {loc.area_id?.name || trans.checkInspections.unidentified} - {trans.checkInspections.bay}: {loc.bay},{' '}
                {trans.checkInspections.row}: {loc.row}, {trans.checkInspections.column}: {loc.column}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label={trans.checkInspections.updateTime}
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />

          <TextField
            fullWidth
            select
            label={trans.checkInspections.status}
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
          >
            <MenuItem value="">{trans.checkInspections.all}</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            onClick={() => {
              setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              fetchInspections(0, rowsPerPage);
            }}
          >
            {sortDirection === 'asc' ? trans.checkInspections.ascending : trans.checkInspections.descending}
          </Button>

          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            {trans.checkInspections.search}
          </Button>

          <Button fullWidth size="small" variant="outlined" onClick={handleReset}>
            {trans.checkInspections.refresh}
          </Button>
        </Stack>
      </Box>

      <Box>
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          </>
        ) : (
          <>
            <Accordion defaultExpanded sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {trans.checkInspections.uncheckedItems} ({uncheckedInspections.length} {trans.checkInspections.inspections})
                  {uncheckedInspections.length > rowsPerPage && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      - Trang {uncheckedPage + 1} của {Math.ceil(uncheckedInspections.length / rowsPerPage)}
                    </Typography>
                  )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {uncheckedInspections.length === 0 ? (
                  <Typography>{trans.checkInspections.noUncheckedInspections}</Typography>
                ) : (
                  <>
                    <Stack spacing={2}>
                      {paginatedUncheckedInspections.map((inspection) => (
                        <Paper
                          key={inspection._ids.join('-')}
                          variant="outlined"
                          sx={{ p: 2, bgcolor: 'background.paper', position: 'relative' }}
                          elevation={0}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            {trans.checkInspections.location}: {getLocationLabel(inspection.location)} - {trans.checkInspections.status}:{' '}
                            {inspection.status === 'draft'
                              ? trans.checkInspections.draft
                              : inspection.status === 'checking'
                                ? trans.checkInspections.checking
                                : inspection.status === 'checked'
                                  ? trans.checkInspections.checked
                                  : inspection.status}
                          </Typography>

                          <Table size="small" aria-label="check-list-items">
                            <TableHead>
                              <TableRow>
                                <TableCell>{trans.checkInspections.medicineName}</TableCell>
                                <TableCell>{trans.checkInspections.licenseCode}</TableCell>
                                <TableCell align="right">{trans.checkInspections.expectedQuantity}</TableCell>
                                <TableCell align="right">{trans.checkInspections.actualQuantity}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(inspection.check_list || [])
                                .filter((item) => item.actual_quantity === 0)
                                .map((checkItem, idx) => {
                                  const medicine = checkItem.package_id?.batch_id?.medicine_id;
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>{medicine?.medicine_name || 'Không xác định'}</TableCell>
                                      <TableCell>{medicine?.license_code || '-'}</TableCell>
                                      <TableCell align="right">{checkItem.expected_quantity}</TableCell>
                                      <TableCell align="right">{checkItem.actual_quantity}</TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>

                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {trans.checkInspections.notes}: {inspection.notes || '-'}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>

                    {/* Pagination for unchecked inspections */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <TablePagination
                        component="div"
                        count={uncheckedInspections.length}
                        page={uncheckedPage}
                        onPageChange={(event, newPage) => setUncheckedPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event, newRowsPerPage) => {
                          setRowsPerPage(newRowsPerPage);
                          setUncheckedPage(0);
                          setCheckedPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Số phiếu mỗi trang:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
                      />
                    </div>
                  </>
                )}
              </AccordionDetails>
            </Accordion>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {trans.checkInspections.checkedItems} ({checkedInspections.length} {trans.checkInspections.inspections})
                  {checkedInspections.length > rowsPerPage && (
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      - Trang {checkedPage + 1} của {Math.ceil(checkedInspections.length / rowsPerPage)}
                    </Typography>
                  )}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {checkedInspections.length === 0 ? (
                  <Typography>{trans.checkInspections.noCheckedInspections}</Typography>
                ) : (
                  <>
                    <Stack spacing={2}>
                      {paginatedCheckedInspections.map((inspection) => (
                        <Paper
                          key={inspection._ids.join('-')}
                          variant="outlined"
                          sx={{ p: 2, bgcolor: 'background.paper', position: 'relative' }}
                          elevation={0}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                            Vị trí: {getLocationLabel(inspection.location)} - Trạng thái: {inspection.status}
                          </Typography>

                          <Table size="small" aria-label="check-list-items">
                            <TableHead>
                              <TableRow>
                                <TableCell>{trans.checkInspections.medicineName}</TableCell>
                                <TableCell>{trans.checkInspections.licenseCode}</TableCell>
                                <TableCell align="right">{trans.checkInspections.expectedQuantity}</TableCell>
                                <TableCell align="right">{trans.checkInspections.actualQuantity}</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {(inspection.check_list || [])
                                .filter((item) => item.actual_quantity > 0)
                                .map((checkItem, idx) => {
                                  const medicine = checkItem.package_id?.batch_id?.medicine_id;
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell>{medicine?.medicine_name || 'Không xác định'}</TableCell>
                                      <TableCell>{medicine?.license_code || '-'}</TableCell>
                                      <TableCell align="right">{checkItem.expected_quantity}</TableCell>
                                      <TableCell align="right">{checkItem.actual_quantity}</TableCell>
                                    </TableRow>
                                  );
                                })}
                            </TableBody>
                          </Table>

                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {trans.checkInspections.notes}: {inspection.notes || '-'}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>

                    {/* Pagination for checked inspections */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                      <TablePagination
                        component="div"
                        count={checkedInspections.length}
                        page={checkedPage}
                        onPageChange={(event, newPage) => setCheckedPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(event, newRowsPerPage) => {
                          setRowsPerPage(newRowsPerPage);
                          setUncheckedPage(0);
                          setCheckedPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        labelRowsPerPage="Số phiếu mỗi trang:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count !== -1 ? count : `hơn ${to}`}`}
                      />
                    </div>
                  </>
                )}
              </AccordionDetails>
            </Accordion>
          </>
        )}
      </Box>
    </Box>
  );
}

export default CheckInspections;
