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
import DetailsIcon from '@mui/icons-material/Details';
import { Search as SearchIcon, ArrowUpward as ArrowUpwardIcon, ArrowDownward as ArrowDownwardIcon } from '@mui/icons-material';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CheckInspections() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  // States filter, sort, search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Other states
  const [loading, setLoading] = useState(true);
  const [checkBy, setCheckBy] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [locationsList, setLocationsList] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [page, setPage] = useState(0);
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

  // Load current user info from localStorage once
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

  // Load locations list once
  useEffect(() => {
    axios
      .get(`${backendUrl}/api/locations`, { headers: getAuthHeaders() })
      .then((res) => setLocationsList(res.data))
      .catch((error) => {
        console.error('Failed to load locations:', error);
        enqueueSnackbar('Không thể tải dữ liệu vị trí kho.', { variant: 'error' });
      });
  }, []);

  const groupInspectionsByLocation = (inspections) => {
    const map = new Map();

    inspections.forEach((insp) => {
      const loc = insp.location_id;
      if (!loc) return;

      // Tạo key định danh duy nhất cho location (dựa theo khu vực, bay, row, column)
      const key = `${loc.area_id?.name || 'Không xác định'}|${loc.bay}|${loc.row}|${loc.column}`;

      if (!map.has(key)) {
        map.set(key, {
          location: loc,
          status: insp.status,
          notes: insp.notes,
          check_list: [...(insp.check_list || [])],
          _ids: [insp._id] // lưu array id phiếu con
        });
      } else {
        const existing = map.get(key);

        // Map phụ để lọc thuốc trùng theo package_id._id hoặc _id của check_list item
        const itemMap = new Map();

        // Thêm các thuốc hiện có
        existing.check_list.forEach((item) => {
          const itemKey = item.package_id?._id || item._id;
          if (itemKey) {
            itemMap.set(itemKey, item);
          }
        });

        // Thêm thuốc mới nếu chưa có
        (insp.check_list || []).forEach((item) => {
          const itemKey = item.package_id?._id || item._id;
          if (itemKey && !itemMap.has(itemKey)) {
            itemMap.set(itemKey, item);
          }
        });

        // Cập nhật check_list là mảng thuốc không trùng
        existing.check_list = Array.from(itemMap.values());

        // Có thể cập nhật status, notes nếu muốn (ví dụ lấy status cao nhất, notes nối)
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

  // Các hàm fetch dữ liệu + cập nhật trạng thái
  const fetchInspections = (pageParam = page, rowsPerPageParam = rowsPerPage) => {
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

    axios
      .get(`${backendUrl}/api/inventory/inspection-from-order/${checkOrderId}`, {
        headers: getAuthHeaders(),
        params
      })
      .then(async (res) => {
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

          // Fetch user data for check_by
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
      })
      .catch((error) => {
        console.error('Error fetching inspections', error);
        enqueueSnackbar('Không thể tải dữ liệu phiếu kiểm kê.', { variant: 'error' });
        setInspections([]);
        setUsersMap({});
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  };

  const fetchOrderForDisplay = async () => {
    if (!checkOrderId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.success && res.data.data) {
        const order = res.data.data.checkorder;
        setOrderData(order);

        if (Array.isArray(order.items)) {
          const items = order.items.map((item) => ({
            id: item.medicine_id._id,
            name: item.medicine_id.medicine_name,
            stock: item.stock
          }));
          setInventoryItems(items);
        }

        fetchInspections(0, rowsPerPage);
      } else {
        enqueueSnackbar('Không lấy được dữ liệu đơn kiểm kê.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Failed to load check order:', error);
      enqueueSnackbar('Lỗi tải đơn kiểm kê.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderAndDecide = async () => {
    if (!checkOrderId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: getAuthHeaders()
      });
      if (res.data?.success && res.data.data) {
        const order = res.data.data.checkorder;
        setOrderData(order);

        if (order.status?.toLowerCase() === 'processing') {
          enqueueSnackbar('Toàn kho đang trong trạng thái khóa, không thể tạo phiếu mới', { variant: 'info' });
        }

        if (Array.isArray(order.items)) {
          const items = order.items.map((item) => ({
            id: item.medicine_id._id,
            name: item.medicine_id.medicine_name,
            stock: item.stock
          }));
          setInventoryItems(items);
        }
        fetchInspections(0, rowsPerPage);
      } else {
        enqueueSnackbar('Không lấy được dữ liệu đơn kiểm kê.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Failed to load check order:', error);
      enqueueSnackbar('Lỗi tải đơn kiểm kê.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // useEffect gọi khi có checkOrderId và checkBy
  useEffect(() => {
    if (checkOrderId && checkBy) {
      fetchOrderAndDecide();
    }
  }, [checkOrderId, checkBy]);

  // useEffect tạo phiếu và cập nhật trạng thái khi orderData thay đổi
  useEffect(() => {
    const createInspectionsAndUpdateStatus = async () => {
      if (!checkOrderId || !checkBy || !orderData) return;
      if (orderData.status?.toLowerCase() === 'processing') return;

      setLoading(true);
      try {
        const updateRes = await axios.patch(
          `${backendUrl}/api/inventory/check-order/${checkOrderId}`,
          { status: 'processing' },
          { headers: getAuthHeaders() }
        );

        if (updateRes.data?.success && updateRes.data.updated === true) {
          enqueueSnackbar(updateRes.data.message || 'Cập nhật trạng thái đơn kiểm kê thành công.', {
            variant: 'success'
          });

          const createRes = await axios.post(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {}, { headers: getAuthHeaders() });

          enqueueSnackbar(createRes.data?.message || 'Đã tạo phiếu kiểm kê cho tất cả vị trí.', {
            variant: createRes.data?.success ? 'success' : 'info'
          });

          // Load lại dữ liệu sau cập nhật
          await fetchOrderForDisplay();
          fetchInspections(0, rowsPerPage);
        } else if (updateRes.data?.updated === false) {
          enqueueSnackbar(updateRes.data.message || 'Đang có đợt kiểm kê khác, trạng thái giữ nguyên.', {
            variant: 'info'
          });
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Tạo phiếu hoặc cập nhật trạng thái thất bại.';
        console.error('Lỗi khi tạo phiếu hoặc cập nhật trạng thái:', error);
        enqueueSnackbar(errorMsg, { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    createInspectionsAndUpdateStatus();
  }, [checkOrderId, checkBy, orderData]);

  // UI events:
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
    setPage(0);
    fetchInspections(0, rowsPerPage);
  };

  const handleReset = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterDate('');
    setFilterStatus('');
    setSortDirection('asc');
    setPage(0);
    fetchInspections(0, rowsPerPage);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchInspections(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRpp = parseInt(event.target.value, 10);
    setRowsPerPage(newRpp);
    setPage(0);
    fetchInspections(0, newRpp);
  };

  // Hiển thị location label helper
  const getLocationLabel = (location) => {
    if (!location) return '';
    const areaName = location.area_id?.name || 'Không xác định';
    return `Khu vực: ${areaName}, Bay: ${location.bay}, Row: ${location.row}, Column: ${location.column}`;
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Danh sách phiếu kiểm kê con cho 1 đợt
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Quản lý và theo dõi các phiếu kiểm kê cho đợt kiểm kê toàn kho
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="warning"
          startIcon={<DetailsIcon />}
          onClick={() => router.push(`/wh-inventory/check-orders/${checkOrderId}`)}
          disabled={loading}
        >
          Xem thống kê chi tiết của đợt kiểm kê này
        </Button>
      </Box>

      {orderData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Thông tin Phiếu Kiểm Kê: <strong>{orderData._id}</strong>
          </Typography>
          <Typography variant="body2">
            Warehouse Manager: {orderData.warehouse_manager_id.email} | Người tạo: {orderData.created_by?.email || '-'} | Ngày kiểm kê:{' '}
            {orderData.inventory_check_date ? new Date(orderData.inventory_check_date).toLocaleDateString('vi-VN') : '-'} | Trạng thái:{' '}
            {orderData.status === 'pending'
              ? 'chưa bắt đầu'
              : orderData.status === 'processing'
                ? 'đang tiến hành'
                : orderData.status === 'completed'
                  ? 'đã hoàn thành'
                  : orderData.status}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Ghi chú: {orderData.notes || '-'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, fontSize: '0.875rem' }}>
            Ngày tạo: {orderData.createdAt ? new Date(orderData.createdAt).toLocaleString('vi-VN') : '-'} | Ngày cập nhật:{' '}
            {orderData.updatedAt ? new Date(orderData.updatedAt).toLocaleString('vi-VN') : '-'}
          </Typography>
        </Alert>
      )}

      {/* Các bộ lọc và UI search */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {/* Tìm kiếm */}
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label="Tìm kiếm"
            placeholder="Tìm kiếm"
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

          {/* Lọc vị trí kho */}
          <TextField
            fullWidth
            select
            label="Vị trí kho"
            value={filterLocation}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            size="small"
          >
            <MenuItem value="">Tất cả vị trí</MenuItem>
            {locationsList.map((loc) => (
              <MenuItem key={loc._id} value={loc._id}>
                {loc.area_id?.name || 'Không xác định'} - Bay: {loc.bay}, Row: {loc.row}, Column: {loc.column}
              </MenuItem>
            ))}
          </TextField>

          {/* Lọc thời điểm cập nhật */}
          <TextField
            fullWidth
            label="Thời điểm cập nhật"
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />

          {/* Lọc trạng thái */}
          <TextField
            fullWidth
            select
            label="Trạng thái"
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            size="small"
          >
            <MenuItem value="">Tất cả</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>

          {/* Nút đổi chiều sort */}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Tăng dần' : 'Giảm dần'}
          </Button>

          {/* Nút tìm kiếm */}
          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            Search
          </Button>

          {/* Nút reset bộ lọc */}
          <Button fullWidth size="small" variant="outlined" onClick={handleReset}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Hiển thị nhóm phiếu "chưa kiểm" */}
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
                <Typography variant="h6">Mặt hàng chưa kiểm ({uncheckedInspections.length} phiếu)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {uncheckedInspections.length === 0 ? (
                  <Typography>Không có phiếu kiểm kê chưa kiểm.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {uncheckedInspections.map((inspection) => (
                      <Paper
                        key={inspection._ids.join('-') /* nối nhiều id phiếu con trong location */}
                        variant="outlined"
                        sx={{ p: 2, bgcolor: 'background.paper', position: 'relative' }}
                        elevation={0}
                      >
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                          Vị trí: {getLocationLabel(inspection.location)} - Trạng thái:{' '}
                          {inspection.status === 'draft'
                            ? 'Chưa kiểm'
                            : inspection.status === 'checking'
                              ? 'Đang kiểm'
                              : inspection.status === 'checked'
                                ? 'Đã kiểm'
                                : inspection.status}
                        </Typography>

                        <Table size="small" aria-label="check-list-items">
                          <TableHead>
                            <TableRow>
                              <TableCell>Tên thuốc</TableCell>
                              <TableCell>License code</TableCell>
                              <TableCell align="right">Số lượng dự kiến</TableCell>
                              <TableCell align="right">Số lượng thực tế</TableCell>
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
                          Ghi chú: {inspection.notes || '-'}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Hiển thị nhóm phiếu "đã kiểm" */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Mặt hàng đã kiểm ({checkedInspections.length} phiếu)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {checkedInspections.length === 0 ? (
                  <Typography>Không có phiếu kiểm kê đã kiểm.</Typography>
                ) : (
                  <>
                    <Stack spacing={2}>
                      {checkedInspections.map((inspection) => (
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
                                <TableCell>Tên thuốc</TableCell>
                                <TableCell>License code</TableCell>
                                <TableCell align="right">Số lượng dự kiến</TableCell>
                                <TableCell align="right">Số lượng thực tế</TableCell>
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
                            Ghi chú: {inspection.notes || '-'}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>

                    <TablePagination
                      component="div"
                      count={totalCount}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Số hàng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count !== -1 ? count : `hơn ${to}`}`}
                      sx={{ mt: 2 }}
                    />
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
