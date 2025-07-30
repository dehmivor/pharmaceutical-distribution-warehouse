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
  IconButton,
  Button,
  TablePagination,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DetailsIcon from '@mui/icons-material/Details';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function CheckInspections() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();

  // State filter, sort, search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' hoặc 'desc'

  // Các state cũ
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

  // Các trạng thái ví dụ (có thể tùy biến theo backend)
  const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('auth-token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Load user hiện tại
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

  // Load locations list
  useEffect(() => {
    axios
      .get(`${backendUrl}/api/locations`, { headers: getAuthHeaders() })
      .then((res) => setLocationsList(res.data))
      .catch((error) => {
        console.error('Failed to load locations:', error);
        enqueueSnackbar('Không thể tải dữ liệu vị trí kho.', { variant: 'error' });
      });
  }, []);

  // Load chi tiết đơn và xử lý trạng thái
  useEffect(() => {
    if (!checkOrderId) return;

    const fetchOrderAndDecide = async () => {
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
            if (Array.isArray(order.items)) {
              const items = order.items.map((item) => ({
                id: item.medicine_id._id,
                name: item.medicine_id.medicine_name,
                stock: item.stock
              }));
              setInventoryItems(items);
            }
            // Đơn chưa processing, sẽ đợi useEffect tạo phiếu
          }
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

    fetchOrderAndDecide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOrderId]);

  // Hàm xử lý đổi filter field
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

  // Xử lý khi nhấn nút Search (tải dữ liệu mới với filter, sort)
  const handleSearchClick = () => {
    setPage(0);
    fetchInspections(0, rowsPerPage);
  };

  // Reset filter, sort về mặc định
  const handleReset = () => {
    setSearchTerm('');
    setFilterLocation('');
    setFilterDate('');
    setFilterStatus('');
    setSortDirection('asc');
    setPage(0);
    fetchInspections(0, rowsPerPage);
  };

  // Hàm fetch inspections với query filter, sort
  const fetchInspections = (pageParam = page, rowsPerPageParam = rowsPerPage) => {
    if (!checkOrderId) return;
    setLoading(true);

    const params = {
      page: pageParam + 1, // backend pagination start from 1
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
          const processedInspections = inspectionsData.map((inspection) => {
            const firstCheckItem = inspection.check_list?.[0] || null;
            const med = firstCheckItem?.medicine_id || null;

            return {
              _id: inspection._id,
              inventory_check_order_id: inspection.inventory_check_order_id?._id || inspection.inventory_check_order_id,
              status: inspection.status,
              location_id: inspection.location_id,
              notes: inspection.notes,
              check_by: inspection.check_by,
              date: inspection.createdAt || inspection.updatedAt || null,
              item: med
                ? {
                    medicine_id: med._id,
                    medicine_name: med.medicine_name,
                    license_code: med.license_code,
                    expectedQuantity: firstCheckItem.expected_quantity,
                    actualQuantity: firstCheckItem.actual_quantity
                  }
                : null
            };
          });
          setInspections(processedInspections);

          // Lấy userId duy nhất
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

  // Tạo phiếu kiểm loạt và cập nhật trạng thái khi đơn chưa processing
  useEffect(() => {
    const createInspectionsAndUpdateStatus = async () => {
      if (!checkOrderId || !checkBy || !orderData) return;
      if (orderData.status?.toLowerCase() === 'processing') return;

      setLoading(true);
      try {
        await axios.post(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {}, { headers: getAuthHeaders() });

        enqueueSnackbar('Đã tạo phiếu kiểm kê cho tất cả vị trí.', { variant: 'success' });

        await axios.patch(
          `${backendUrl}/api/inventory/check-order/${checkOrderId}`,
          { status: 'processing' },
          { headers: getAuthHeaders() }
        );

        enqueueSnackbar('Cập nhật trạng thái đơn kiểm kê thành công.', { variant: 'success' });

        fetchInspections(0, rowsPerPage);
      } catch (error) {
        console.error('Lỗi khi tạo phiếu hoặc cập nhật trạng thái:', error);
        enqueueSnackbar('Tạo phiếu hoặc cập nhật trạng thái thất bại.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    createInspectionsAndUpdateStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkOrderId, checkBy, orderData]);

  // Xử lý đổi trang
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchInspections(newPage, rowsPerPage);
  };

  // Xử lý đổi số hàng/trang
  const handleChangeRowsPerPage = (event) => {
    const newRpp = parseInt(event.target.value, 10);
    setRowsPerPage(newRpp);
    setPage(0);
    fetchInspections(0, newRpp);
  };

  // Xóa phiếu kiểm kê
  const handleDeleteInspection = (inspectionId) => {
    if (!inspectionId || inspectionId.length !== 24) {
      enqueueSnackbar('ID phiếu kiểm kê không hợp lệ để xóa.', { variant: 'error' });
      return;
    }
    axios
      .delete(`${backendUrl}/api/inventory/${inspectionId}`, {
        headers: getAuthHeaders()
      })
      .then(() => {
        enqueueSnackbar('Phiếu kiểm kê đã được xóa.', { variant: 'success' });
        fetchInspections(page, rowsPerPage);
      })
      .catch((error) => {
        console.error('Failed to delete inspection:', error);
        enqueueSnackbar('Xóa phiếu kiểm kê thất bại.', { variant: 'error' });
      });
  };

  // Danh sách mặt hàng chưa kiểm
  const checkedMedicineIds = new Set(inspections.map((insp) => insp.item?.medicine_id).filter(Boolean));
  const uncheckedMedicines = inventoryItems.filter((item) => !checkedMedicineIds.has(item.id));

  // Lấy label vị trí mô tả
  const getLocationLabel = (location) => {
    if (!location) return '';
    const areaName = location.area_id?.name || 'Không xác định';
    return `Khu vực: ${areaName}, Bay: ${location.bay}, Row: ${location.row}, Column: ${location.column}`;
  };

  return (
    <Box sx={{ padding: 4 }}>
      {/* Tiêu đề và nút Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Tạo phiếu kiểm kê kho thuốc
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
          Xem thống kê chi tiết của phiếu kiểm kê này
        </Button>
      </Box>

      {/* UI filter, search, sort */}
      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
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
          <TextField
            fullWidth
            label="Thời điểm cập nhật"
            type="date"
            value={filterDate}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
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
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={sortDirection === 'asc' ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
            onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          >
            {sortDirection === 'asc' ? 'Tăng dần' : 'Giảm dần'}
          </Button>

          <Button fullWidth size="small" variant="contained" onClick={handleSearchClick} startIcon={<SearchIcon />}>
            Search
          </Button>
          <Button fullWidth size="small" variant="outlined" onClick={handleReset}>
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Mặt hàng chưa kiểm */}
      <Box>
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={150} sx={{ mb: 2 }} />
          </>
        ) : (
          <>
            <Accordion defaultExpanded sx={{ mb: 5 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Mặt hàng chưa kiểm ({uncheckedMedicines.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {uncheckedMedicines.length === 0 ? (
                  <Typography>Không còn mặt hàng nào chưa kiểm.</Typography>
                ) : (
                  <Table size="small" aria-label="unchecked-items">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tên mặt hàng</TableCell>
                        <TableCell align="right">Tồn kho</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {uncheckedMedicines.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell align="right">{item.stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Mặt hàng đã kiểm */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Mặt hàng đã kiểm ({totalCount})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {inspections.length > 0 ? (
                  <>
                    <Table size="small" aria-label="checked-items">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tên mặt hàng</TableCell>
                          <TableCell align="right">Số lượng dự kiến</TableCell>
                          <TableCell align="right">Số lượng thực tế</TableCell>
                          <TableCell>Vị trí</TableCell>
                          <TableCell align="right">Tồn kho</TableCell>
                          <TableCell>Người kiểm</TableCell>
                          <TableCell align="center">Hành động</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inspections.map((inspection) => (
                          <TableRow key={inspection._id}>
                            <TableCell>{inspection.item?.medicine_name ?? 'Không xác định'}</TableCell>
                            <TableCell align="right">{inspection.item?.expectedQuantity ?? '-'}</TableCell>
                            <TableCell align="right">{inspection.item?.actualQuantity ?? '-'}</TableCell>
                            <TableCell>{getLocationLabel(inspection.location_id)}</TableCell>
                            <TableCell align="right">
                              {inventoryItems.find((m) => m.id === (inspection.item?.medicine_id || ''))?.stock || '-'}
                            </TableCell>
                            <TableCell>
                              {inspection.check_by ? inspection.check_by.email || inspection.check_by.name || 'Không có' : 'Không có'}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                aria-label="delete"
                                size="small"
                                color="error"
                                onClick={() => handleDeleteInspection(inspection._id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <TablePagination
                      component="div"
                      count={totalCount}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      labelRowsPerPage="Số hàng mỗi trang:"
                      labelDisplayedRows={({ from, to, count }) => `${from}-${to} của ${count}`}
                      sx={{ mt: 2 }}
                    />
                  </>
                ) : (
                  <Typography>Chưa có phiếu kiểm kê nào.</Typography>
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
