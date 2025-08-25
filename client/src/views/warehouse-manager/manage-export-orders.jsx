'use client';

import { Refresh as RefreshIcon, Search as SearchIcon, QrCodeScanner, Add as AddIcon } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Stack,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  Divider,
  Checkbox,
  FormControlLabel,
  Select,
  InputLabel,
  FormControl,
  Tooltip
} from '@mui/material';
import { Delete } from '@mui/icons-material';
import axios from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useTrans from '@/hooks/useTrans';
import { useRouter } from 'next/navigation';
import ModalConfirm from '../../views/general/ModalConfirm';
import { enqueueSnackbar } from 'notistack';

const USER_ROLES = {
  WAREHOUSEMANAGER: 'warehouse_manager',
  WAREHOUSE: 'warehouse'
};

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

const getStatusBadge = (status) => {
  const statusConfig = {
    draft: { label: 'Nháp', color: 'default' },
    approved: { label: 'Đã duyệt', color: 'primary' },
    returned: { label: 'Đã trả lại', color: 'info' },
    rejected: { label: 'Đã từ chối', color: 'warning' },
    completed: { label: 'Hoàn thành', color: 'success' },
    cancelled: { label: 'Đã hủy', color: 'error' }
  };
  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default function ManageExportOrders() {
  const router = useRouter();
  const trans = useTrans();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all | internal | regular
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [packingDetails, setPackingDetails] = useState([]);
  const [availablePackages, setAvailablePackages] = useState({});
  const [showingPackageListFor, setShowingPackageListFor] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  const [downloadReceiptLoading, setdownloadReceiptLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    loading: false
  });
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: 'Thông báo',
    content: ''
  });

  // Internal Export Order dialog state
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [internalLines, setInternalLines] = useState([]); // [{ medicine_id, destroy_total, picked: [{package_id, destroy_qty, remaining_after, max}] }]
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [creatingInternal, setCreatingInternal] = useState(false);

  const getAuthToken = () => localStorage.getItem('auth-token');

  const calculateTotalValue = (order) => {
    if (!order?.details) return 0;
    return order.details.reduce((total, detail) => {
      const actualQuantity = detail.actual_item.reduce((sum, item) => sum + item.quantity, 0);
      return total + actualQuantity * detail.unit_price;
    }, 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget);
    setMenuOrder(order);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuOrder(null);
  };

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      setIsRoleLoading(true);
      const token = getAuthToken();
      if (!token) {
        router.push('/auth/login');
        setIsRoleLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push('/auth/login');
          }
          throw new Error('Failed to fetch current user role');
        }
        const data = await res.json();
        setCurrentUserRole(data.data.role);
        setCurrentUserId(data.data.userId);
      } catch (error) {
        setMessageDialog({ open: true, title: 'Lỗi', content: 'Lỗi khi tải vai trò người dùng.' });
      } finally {
        setIsRoleLoading(false);
      }
    };
    fetchCurrentUserRole();
  }, [router]);

  const fetchOrders = async (p = null, rpp = null, date = null, status = null, assignedToMe = null, type = null) => {
    setLoading(true);
    setError(null);
    try {
      const currentPage = p !== null ? p : page;
      const currentLimit = rpp !== null ? rpp : rowsPerPage;
      const currentDate = date !== null ? date : filterDate;
      const currentStatus = status !== null ? status : filterStatus;
      const currentAssignedToMe = assignedToMe !== null ? assignedToMe : filterAssignedToMe;
      const currentType = type !== null ? type : filterType;
      const qp = new URLSearchParams();
      qp.append('page', (currentPage + 1).toString());
      qp.append('limit', currentLimit.toString());
      if (currentDate) qp.append('createdAt', currentDate);
      if (currentStatus) qp.append('status', currentStatus);
      if (currentAssignedToMe && currentUserId) qp.append('warehouse_manager_id', currentUserId);
      const url = `/api/export-orders${qp.toString() ? `?${qp.toString()}` : ''}`;
      const resp = await axios.get(url, { headers: getAuthHeaders() });
      if (!resp.data.success) {
        throw new Error(resp.data.error || 'Failed to load export orders');
      }
      let data = resp.data.data || [];
      // Client-side type filtering
      if (currentType === 'internal') data = data.filter((o) => !o.contract_id);
      else if (currentType === 'regular') data = data.filter((o) => !!o.contract_id);
      setOrders(data);
      const pag = resp.data.pagination;
      setTotalCount(pag?.total ?? data.length);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setMessageDialog({ open: true, title: 'Lỗi', content: err.response?.data?.error || err.message });
      setOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMedicines = async () => {
    setLoadingMedicines(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');
      const res = await fetch(`/api/medicine/all/v1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load medicines');
      setMedicines(data.data || []);
    } catch (e) {
      setMessageDialog({ open: true, title: 'Lỗi', content: e.message || 'Không thể tải danh sách thuốc' });
    } finally {
      setLoadingMedicines(false);
    }
  };

  const fetchAvailablePackages = async (medicineId) => {
    const token = getAuthToken();
    if (!token) throw new Error('No auth token found');
    const res = await fetch(`/api/packages/${medicineId}/packages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to fetch packages');
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to fetch packages');
    const packages = data.data.flatMap((batchGroup) =>
      batchGroup.packages
        .filter((pkg) => pkg.quantity > 0)
        .map((pkg) => ({
          ...pkg,
          batch: batchGroup.batch
        }))
    );
    return packages;
  };

  useEffect(() => {
    if (!isRoleLoading && currentUserRole) {
      fetchOrders(undefined, undefined, undefined, undefined, undefined, filterType);
    }
  }, [page, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, isRoleLoading, currentUserRole, filterType]);

  useEffect(() => {
    if (selectedOrder && packingDialogOpen) {
      const fetchPackages = async () => {
        try {
          const medicineIds = selectedOrder.details.map((detail) => detail.medicine_id._id);
          const packagesPromises = medicineIds.map((medicineId) => fetchAvailablePackages(medicineId));
          const packagesResults = await Promise.all(packagesPromises);
          const availablePackagesTemp = {};
          medicineIds.forEach((medicineId, index) => {
            availablePackagesTemp[medicineId] = packagesResults[index];
          });
          setAvailablePackages(availablePackagesTemp);
        } catch (error) {
          setMessageDialog({ open: true, title: 'Lỗi', content: 'Lỗi khi tải danh sách gói hàng.' });
        }
      };
      fetchPackages();
    }
  }, [selectedOrder, packingDialogOpen]);

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage);
  }, []);

  const handleSearchClick = useCallback(() => {
    setPage(0);
    fetchOrders(0, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType);
  }, [rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType]);

  const handleRefresh = useCallback(() => {
    fetchOrders(page, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType);
  }, [page, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType]);

  const handleReset = useCallback(() => {
    setFilterDate('');
    setFilterStatus('');
    setFilterAssignedToMe(false);
    setFilterType('all');
    setPage(0);
  }, []);

  const handleOpenViewDetailsDialog = (order) => {
    setSelectedOrder(order);
    setViewDetailsDialogOpen(true);
    handleMenuClose();
  };

  const handleCloseViewDetailsDialog = () => {
    setViewDetailsDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleOpenPackingDialog = (order) => {
    setSelectedOrder(order);
    setPackingDetails(
      order.details.map((detail) => ({
        medicine_id: detail.medicine_id._id,
        expected_quantity: detail.expected_quantity,
        unit_price: detail.unit_price,
        selected_packages: detail.actual_item.map((item) => ({
          package_id: item.package_id._id || item.package_id,
          quantity: item.quantity,
          created_by: item.created_by._id || item.created_by
        }))
      }))
    );
    setPackingDialogOpen(true);
  };

  const handleClosePackingDialog = () => {
    setPackingDialogOpen(false);
    setPackingDetails([]);
    setAvailablePackages({});
    setShowingPackageListFor(null);
  };

  const handleQuantityChange = (medicineId, packageId, value) => {
    const quantity = Number.parseInt(value) || 0;
    setPackingDetails((prev) =>
      prev.map((detail) =>
        detail.medicine_id === medicineId
          ? {
              ...detail,
              selected_packages: detail.selected_packages.map((sp) => (sp.package_id === packageId ? { ...sp, quantity } : sp))
            }
          : detail
      )
    );
  };

  const addPackage = (medicineId, packageId) => {
    setPackingDetails((prev) =>
      prev.map((detail) =>
        detail.medicine_id === medicineId
          ? {
              ...detail,
              selected_packages: [...detail.selected_packages, { package_id: packageId, quantity: 0, created_by: currentUserId }]
            }
          : detail
      )
    );
    setShowingPackageListFor(null);
  };

  const removePackage = (medicineId, packageId) => {
    setPackingDetails((prev) =>
      prev.map((detail) =>
        detail.medicine_id === medicineId
          ? {
              ...detail,
              selected_packages: detail.selected_packages.filter((sp) => sp.package_id !== packageId)
            }
          : detail
      )
    );
  };

  const handleUpdatePacking = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    for (const detail of packingDetails) {
      if (!detail.medicine_id) {
        setMessageDialog({ open: true, title: 'Lỗi', content: 'Thiếu ID thuốc trong chi tiết đóng gói.' });
        return;
      }
      if (!detail.selected_packages || !Array.isArray(detail.selected_packages)) {
        setMessageDialog({ open: true, title: 'Lỗi', content: 'Danh sách gói hàng phải là mảng.' });
        return;
      }
      for (const sp of detail.selected_packages) {
        if (!sp.package_id) {
          setMessageDialog({ open: true, title: 'Lỗi', content: 'Thiếu ID gói hàng trong danh sách đã chọn.' });
          return;
        }
        if (typeof sp.quantity !== 'number' || sp.quantity < 0) {
          setMessageDialog({ open: true, title: 'Lỗi', content: 'Số lượng phải là số không âm.' });
          return;
        }
        if (!sp.created_by) {
          sp.created_by = currentUserId;
        }
      }
    }

    const allQuantitiesMatch = packingDetails.every((detail) => {
      const totalActual = detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0);
      return totalActual >= detail.expected_quantity;
    });

    if (currentUserRole === USER_ROLES.WAREHOUSE && !allQuantitiesMatch) {
      setConfirmDialog({
        open: true,
        title: 'Xác nhận tiếp tục',
        content: 'Một số mặt hàng chưa đạt số lượng yêu cầu. Bạn có muốn tiếp tục cập nhật không?',
        onConfirm: async () => {
          await performUpdatePacking();
          setConfirmDialog({ ...confirmDialog, open: false });
        },
        confirmText: 'Tiếp tục',
        cancelText: 'Hủy',
        loading: false
      });
      return;
    }
    await performUpdatePacking();
  };

  const performUpdatePacking = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const token = getAuthToken();
      if (!token) {
        setMessageDialog({ open: true, title: 'Lỗi', content: 'Không có token xác thực. Vui lòng đăng nhập lại.' });
        return;
      }
      const payloadDetails = packingDetails.map((detail) => ({
        medicine_id: detail.medicine_id,
        expected_quantity: detail.expected_quantity,
        unit_price: detail.unit_price,
        actual_item: detail.selected_packages.map((sp) => ({
          package_id: sp.package_id,
          quantity: sp.quantity,
          created_by: sp.created_by
        }))
      }));
      const res = await fetch(`/api/export-orders/${selectedOrder._id}/update-packing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ details: payloadDetails })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update packing');
      }
      const updatedOrder = await res.json();
      setOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)));
      handleClosePackingDialog();
      setMessageDialog({ open: true, title: 'Thành công', content: 'Cập nhật đóng gói thành công!' });
    } catch (error) {
      setMessageDialog({ open: true, title: 'Lỗi', content: `Cập nhật đóng gói thất bại: ${error.message || ''}` });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCompleteOrder = async (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) {
      setMessageDialog({ open: true, title: 'Lỗi', content: 'Không tìm thấy đơn hàng!' });
      return;
    }
    if (order.status !== 'approved') {
      setMessageDialog({ open: true, title: 'Lỗi', content: 'Đơn hàng phải được duyệt trước khi hoàn thành!' });
      return;
    }
    let totalActual = 0;
    for (const detail of order.details) {
      totalActual += detail.actual_item.reduce((sum, item) => sum + item.quantity, 0);
    }
    if (totalActual <= 0) {
      enqueueSnackbar('Không thể hoàn thành đơn hàng vì tổng số lượng thực tế phải lớn hơn 0.', { variant: 'error' });
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Xác nhận hoàn thành',
      content:
        'Bạn có chắc chắn muốn hoàn thành đơn hàng này không? Số lượng gói hàng sẽ được cập nhật và thay đổi vị trí sẽ được ghi lại.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const token = getAuthToken();
          if (!token) {
            return;
          }
          const res = await fetch(`/api/export-orders/${orderId}/complete`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Không thể hoàn thành đơn hàng');
          }
          const updatedOrder = await res.json();
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)));
          enqueueSnackbar('Đơn hàng đã hoàn thành!', { variant: 'success' });
          await fetchOrders(page, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType);

          if (!updatedOrder.data.contract_id) {
            console.log('Không có contract_id, không tạo bill');
            return;
          }
          const billDetails = (updatedOrder.data.details || []).map((item) => ({
            medicine_lisence_code: item.medicine_id && item.medicine_id._id ? item.medicine_id._id.toString() : '', // thay thế cho license code
            quantity: item.expected_quantity || 0,
            unit_price: item.unit_price || 0
          }));

          // Kiểm tra xem có chi tiết hợp lệ không
          if (billDetails.some((d) => !d.medicine_lisence_code)) {
            throw new Error('Có chi tiết bill thiếu medicine_lisence_code. Vui lòng kiểm tra dữ liệu.');
          }

          // 3. Tạo payload cho Bill với kiểu EXPORT
          const billPayload = {
            export_order_id: updatedOrder.data._id,
            type: 'EXPORT',
            status: 'pending',
            details: billDetails
          };

          try {
            // gọi API tạo Bill
            const createBillRes = await axios.post(`/api/bills`, billPayload, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (createBillRes.data.success) {
              console.log('Bill mới đã được tạo:', createBillRes.data.data);
            } else {
              enqueueSnackbar(`Lỗi khi tạo bill:  createBillRes.data.message`, { variant: 'error' });
            }
          } catch (billErr) {
            console.error('Lỗi khi gọi API tạo bill:', billErr);
            enqueueSnackbar('Lỗi khi tạo bill mới', { variant: 'error' });
          }
        } catch (error) {
          setMessageDialog({
            open: true,
            title: 'Lỗi',
            content: `Hoàn thành đơn hàng thất bại: ${error.message || ''}`
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
          handleCloseViewDetailsDialog();
        }
      },
      confirmText: 'Hoàn thành',
      cancelText: 'Hủy',
      loading: false
    });
  };

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({
      open: true,
      title: 'Xác nhận hủy',
      content: 'Bạn có chắc chắn muốn hủy đơn hàng này không?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const token = getAuthToken();
          if (!token) {
            setMessageDialog({ open: true, title: 'Lỗi', content: 'Không có token xác thực. Vui lòng đăng nhập lại.' });
            return;
          }
          const res = await fetch(`/api/export-orders/${orderId}/cancel`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to cancel order');
          }
          const updatedOrder = await res.json();
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)));
          setMessageDialog({ open: true, title: 'Thành công', content: 'Đơn hàng đã được hủy!' });
        } catch (error) {
          setMessageDialog({ open: true, title: 'Lỗi', content: `Hủy đơn hàng thất bại: ${error.message || ''}` });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
          handleCloseViewDetailsDialog();
        }
      },
      confirmText: 'Hủy đơn',
      cancelText: 'Quay lại',
      loading: false
    });
  };

  const handleAssignToMyself = async (orderId) => {
    handleMenuClose();
    setConfirmDialog({
      open: true,
      title: 'Xác nhận phân công',
      content: 'Bạn có chắc chắn muốn tự phân công đơn hàng này cho mình không?',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const token = getAuthToken();
          if (!token) {
            setMessageDialog({ open: true, title: 'Lỗi', content: 'Không có token xác thực. Vui lòng đăng nhập lại.' });
            return;
          }

          const res = await fetch(`/api/export-orders/${orderId}/assign-warehouse-manager`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ warehouse_manager_id: currentUserId })
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to assign warehouse manager');
          }

          const updatedOrder = await res.json();
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)));
          enqueueSnackbar('Đơn hàng đã được phân công cho bạn!', { variant: 'success' });
        } catch (error) {
          setMessageDialog({
            open: true,
            title: 'Lỗi',
            content: `Phân công đơn hàng thất bại: ${error.message || ''}`
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
        }
      },
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
      loading: false
    });
  };

  // Internal Export: handlers
  const openInternalDialog = async () => {
    await fetchAllMedicines();
    setInternalLines([]);
    setInternalDialogOpen(true);
  };
  const closeInternalDialog = () => {
    setInternalDialogOpen(false);
    setInternalLines([]);
  };

  const addInternalLine = () => {
    setInternalLines((prev) => [...prev, { medicine_id: '', destroy_total: 0, picked: [] }]);
  };

  const removeInternalLine = (index) => {
    setInternalLines((prev) => prev.filter((_, i) => i !== index));
  };

  const changeInternalMedicine = async (index, medicineId) => {
    setInternalLines((prev) => prev.map((l, i) => (i === index ? { ...l, medicine_id: medicineId, picked: [] } : l)));
    try {
      const pkgs = await fetchAvailablePackages(medicineId);
      setAvailablePackages((prev) => ({ ...prev, [medicineId]: pkgs }));
    } catch (e) {
      setMessageDialog({ open: true, title: 'Lỗi', content: e.message || 'Không thể tải packages' });
    }
  };

  const setDestroyTotal = (index, value) => {
    const v = Number.parseInt(value) || 0;
    setInternalLines((prev) => prev.map((l, i) => (i === index ? { ...l, destroy_total: v } : l)));
  };

  const addPickPackage = (lineIndex, packageId) => {
    setInternalLines((prev) =>
      prev.map((l, i) => {
        if (i !== lineIndex) return l;
        const medicineId = l.medicine_id;
        const pkg = (availablePackages[medicineId] || []).find((p) => p._id === packageId);
        if (!pkg) return l;
        const exists = l.picked.some((p) => p.package_id === packageId);
        if (exists) return l;
        return {
          ...l,
          picked: [...l.picked, { package_id: packageId, destroy_qty: 0, remaining_after: pkg.quantity, max: pkg.quantity }]
        };
      })
    );
  };

  const removePickPackage = (lineIndex, packageId) => {
    setInternalLines((prev) =>
      prev.map((l, i) => (i === lineIndex ? { ...l, picked: l.picked.filter((p) => p.package_id !== packageId) } : l))
    );
  };

  const handleScanPackageForLine = (lineIndex) => {
    // TODO: Implement barcode/QR scanner functionality
    // For now, show a dialog to select package manually
    setMessageDialog({
      open: true,
      title: 'Quét Package',
      content: `Tính năng quét barcode/QR code sẽ được implement trong phiên bản tiếp theo. 
      
      Khi scan, hệ thống sẽ tự động:
      1. Tìm package trong danh sách
      2. Nhảy xuống và highlight package đó
      3. Tự động chọn package và mở input nhập số lượng hủy
      
      Hiện tại bạn có thể chọn package thủ công bằng nút "Chọn".`
    });
  };

  const handleDownloadReceipt = async (order_id) => {
    try {
      setdownloadReceiptLoading(true);
      const response = await axios.get(`/api/export-orders/receipt/${order_id}`, {
        headers: getAuthHeaders(),
        responseType: 'blob' // <- important: get binary blob
      });

      // Try to extract filename from Content-Disposition
      const contentDisposition = response.headers['content-disposition'] || '';
      let filename = 'receipt.docx'; // fallback

      // support filename*=UTF-8''encoded-name, filename="name", filename=name
      const filenameRegex = /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches) {
        filename = decodeURIComponent(matches[1] || matches[2] || matches[3]).trim();
      }

      // create a blob and trigger download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });

      // IE / Edge (msSaveOrOpenBlob)
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
        return;
      }

      // Other browsers
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      // release memory
      window.URL.revokeObjectURL(url);
      setdownloadReceiptLoading(false);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError('Lỗi khi tải biên lai');
    }
  };

  const changeDestroyQty = (lineIndex, packageId, value) => {
    const qty = Math.max(0, Number.parseInt(value) || 0);
    setInternalLines((prev) =>
      prev.map((l, i) => {
        if (i !== lineIndex) return l;
        return {
          ...l,
          picked: l.picked.map((p) => {
            if (p.package_id !== packageId) return p;
            const destroy = Math.min(qty, p.max);
            const remaining = p.max - destroy;
            return { ...p, destroy_qty: destroy, remaining_after: remaining };
          })
        };
      })
    );
  };

  const totalDestroyOfLine = (line) => line.picked.reduce((sum, p) => sum + (p.destroy_qty || 0), 0);

  const canSubmitInternal = useMemo(() => {
    if (!currentUserRole || currentUserRole !== USER_ROLES.WAREHOUSEMANAGER) return false;
    if (internalLines.length === 0) return false;
    for (const l of internalLines) {
      if (!l.medicine_id) return false;
      if (l.destroy_total <= 0) return false;
      const totalPick = totalDestroyOfLine(l);
      if (totalPick !== l.destroy_total) return false;
      for (const p of l.picked) {
        if (p.destroy_qty < 0 || p.destroy_qty > p.max) return false;
      }
    }
    return true;
  }, [internalLines, currentUserRole]);

  const submitInternalOrder = async () => {
    try {
      setCreatingInternal(true);
      const token = getAuthToken();
      if (!token) throw new Error('Không có token xác thực');

      const details = internalLines.map((l) => ({
        medicine_id: l.medicine_id,
        expected_quantity: l.destroy_total,
        actual_item: l.picked
          .filter((p) => (p.destroy_qty || 0) > 0)
          .map((p) => ({
            package_id: p.package_id,
            // quantity sent to API must be the destroy quantity (positive integer)
            quantity: p.destroy_qty,
            created_by: currentUserId
          }))
      }));

      const res = await fetch(`/api/export-orders/internal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ details })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.message || 'Tạo đơn xuất nội bộ thất bại');
      setMessageDialog({ open: true, title: 'Thành công', content: 'Tạo đơn xuất nội bộ thành công (đã duyệt)!' });
      closeInternalDialog();
      await fetchOrders(page, rowsPerPage, filterDate, filterStatus, filterAssignedToMe, filterType);
    } catch (e) {
      setMessageDialog({ open: true, title: 'Lỗi', content: e.message || 'Không thể tạo đơn xuất nội bộ' });
    } finally {
      setCreatingInternal(false);
    }
  };

  if (loading || isRoleLoading || !currentUserRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', height: '50vh', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {trans.manageExportOrders.title}
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {trans.manageExportOrders.description}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openInternalDialog} color="primary">
            {trans.manageExportOrders.createInternalExportOrder}
          </Button>
        </Stack>
      </Box>
      <Box component={Paper} sx={{ p: 2, mb: 3 }} elevation={1}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label={trans.manageExportOrders.exportDate}
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
          />
          <TextField select label={trans.manageExportOrders.status} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} size="small" fullWidth>
            <MenuItem value="">{trans.manageExportOrders.all}</MenuItem>
            {['draft', 'approved', 'returned', 'rejected', 'completed', 'cancelled'].map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label={trans.manageExportOrders.type} value={filterType} onChange={(e) => setFilterType(e.target.value)} size="small" fullWidth>
            <MenuItem value="all">{trans.manageExportOrders.allTypes}</MenuItem>
            <MenuItem value="internal">{trans.manageExportOrders.internal}</MenuItem>
            <MenuItem value="regular">{trans.manageExportOrders.regular}</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox checked={filterAssignedToMe} onChange={(e) => setFilterAssignedToMe(e.target.checked)} disabled={!currentUserId} />
            }
            label={trans.manageExportOrders.assignedToMe}
          />
          <Button size="small" variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick} fullWidth>
            {trans.manageExportOrders.search}
          </Button>
          <Button size="small" variant="outlined" onClick={handleReset} startIcon={<RefreshIcon />} fullWidth>
            {trans.manageExportOrders.refresh}
          </Button>
        </Stack>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{trans.manageExportOrders.exportDateCol}</TableCell>
              <TableCell>{trans.manageExportOrders.typeCol}</TableCell>
              <TableCell>{trans.manageExportOrders.contractCode}</TableCell>
              <TableCell>{trans.manageExportOrders.partner}</TableCell>
              <TableCell>{trans.manageExportOrders.managerEmail}</TableCell>
              <TableCell>{trans.manageExportOrders.statusCol}</TableCell>
              <TableCell>{trans.manageExportOrders.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {trans.manageExportOrders.noExportOrdersFound}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {o.contract_id ? (
                      <Chip label="Regular" color="primary" size="small" variant="outlined" />
                    ) : (
                      <Chip label="Internal" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{o.contract_id?.contract_code || '—'}</TableCell>
                  <TableCell>{o.contract_id?.partner_id?.name || '—'}</TableCell>
                  <TableCell>{o.contract_id ? o.warehouse_manager_id?.email || '—' : o.created_by?.email || '—'}</TableCell>
                  <TableCell>
                    <Chip label={getStatusBadge(o.status).props.label} color={getStatusBadge(o.status).props.color} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => handleMenuOpen(e, o)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(Number(e.target.value))}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            handleOpenViewDetailsDialog(menuOrder);
          }}
        >
          {trans.manageExportOrders.detail}
        </MenuItem>
        {currentUserRole === USER_ROLES.WAREHOUSEMANAGER &&
          !!menuOrder?.contract_id &&
          !menuOrder?.warehouse_manager_id &&
          menuOrder?.status === 'approved' && (
            <MenuItem
              onClick={() => {
                handleAssignToMyself(menuOrder._id);
              }}
            >
              {trans.manageExportOrders.assignOrderToMyself}
            </MenuItem>
          )}

        {menuOrder?.status === 'completed' && (
          <MenuItem
            onClick={() => {
              handleDownloadReceipt(menuOrder._id);
            }}
          >
            Print receipt
          </MenuItem>
        )}
      </Menu>

      <Dialog open={viewDetailsDialogOpen} onClose={handleCloseViewDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Chi tiết Đơn hàng Xuất kho</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedOrder && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder._id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mã hợp đồng:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.contract_id?.contract_code || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Người tạo:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.created_by.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Nhân viên phụ trách:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.warehouse_manager_id?.email || 'Chưa phân công'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Trạng thái:
                  </Typography>
                  <Typography component="div" variant="body1" fontWeight="medium">
                    {getStatusBadge(selectedOrder.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ngày tạo:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                  </Typography>
                </Grid>
                {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {selectedOrder.status === 'completed' ? 'Ngày hoàn thành:' : 'Ngày hủy:'}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {(() => {
                        const dateString = selectedOrder.completedAt || selectedOrder.cancelledAt;
                        const date = dateString ? new Date(dateString) : null;
                        return date && !isNaN(date.getTime()) ? date.toLocaleDateString('vi-VN') : 'N/A';
                      })()}
                    </Typography>
                  </Grid>
                )}
                {/* Only show Total Value for regular orders, not for internal destruction orders */}
                {selectedOrder.contract_id && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tổng giá trị:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" color="primary.main">
                      {formatCurrency(calculateTotalValue(selectedOrder))}
                    </Typography>
                  </Grid>
                )}
                {selectedOrder.note && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ghi chú:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedOrder.note || 'Không có ghi chú'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Chi tiết mặt hàng
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="Order details table">
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Thuốc</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>SL Yêu cầu</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>SL Thực tế</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.details.map((detail, detailIdx) => (
                      <TableRow key={detailIdx}>
                        <TableCell>{detail.medicine_id.medicine_name}</TableCell>
                        <TableCell>{detail.expected_quantity}</TableCell>
                        <TableCell>{detail.actual_item.reduce((sum, item) => sum + item.quantity, 0)}</TableCell>
                        <TableCell>{detail.medicine_id.unit_of_measure}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {(currentUserRole === USER_ROLES.WAREHOUSE ||
            (currentUserRole === USER_ROLES.WAREHOUSEMANAGER && selectedOrder?.warehouse_manager_id?._id === currentUserId)) && (
            <Button
              variant="outlined"
              color="info"
              onClick={() => {
                handleOpenPackingDialog(selectedOrder);
              }}
            >
              Chi Tiết Đóng gói {/* Changed button text */}
            </Button>
          )}
          {currentUserRole === USER_ROLES.WAREHOUSEMANAGER &&
            selectedOrder?.warehouse_manager_id?._id === currentUserId &&
            selectedOrder?.status === 'approved' && (
              <>
                <Button variant="contained" color="primary" onClick={() => handleCompleteOrder(selectedOrder._id)}>
                  Hoàn thành
                </Button>
                <Button variant="contained" color="error" onClick={() => handleCancelOrder(selectedOrder._id)}>
                  Hủy đơn hàng
                </Button>
              </>
            )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={packingDialogOpen && (currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER)}
        onClose={handleClosePackingDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Chi tiết Đóng gói</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Xem chi tiết đóng gói cho đơn hàng{' '}
            <Typography component="span" fontWeight="medium">
              {selectedOrder?.contract_id?.contract_code || 'N/A'}
            </Typography>
          </Typography>
          <Box sx={{ maxHeight: 450, overflowY: 'auto', mt: 2, pr: 1 }}>
            {packingDetails.map((detail) => {
              const medicineName =
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id.medicine_name || 'Không xác định';
              const unitOfMeasure =
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id.unit_of_measure ||
                'Không xác định';
              const totalActualQuantity = detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0);
              const isQuantityDeficient = totalActualQuantity < detail.expected_quantity;
              return (
                <Card key={detail.medicine_id} variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {medicineName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Yêu cầu: {detail.expected_quantity} {unitOfMeasure}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Thùng hàng đã chọn:
                  </Typography>
                  {detail.selected_packages.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Chưa có thùng hàng nào được chọn.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      {detail.selected_packages.map((sp) => {
                        const pkg = availablePackages[detail.medicine_id]?.find((p) => p._id === sp.package_id);
                        const maxQuantity = pkg?.quantity || 0;
                        const isInvalidQuantity = sp.quantity > maxQuantity;
                        return (
                          <Box
                            key={sp.package_id}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            sx={{
                              bgcolor: 'grey.50',
                              p: 1.5,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: isInvalidQuantity ? 'error.main' : 'grey.200'
                            }}
                          >
                            <Typography variant="body2" flex={1}>
                              {pkg
                                ? `${pkg.batch.batch_code}, Vị trí: ${pkg.location.area_name || 'N/A'} - ${pkg.location.bay || 'N/A'} - ${pkg.location.row || 'N/A'} - ${pkg.location.column || 'N/A'}`
                                : 'Gói không xác định'}
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: maxQuantity }}
                              value={sp.quantity}
                              onChange={(e) => handleQuantityChange(detail.medicine_id, sp.package_id, e.target.value)}
                              sx={{ width: 90 }}
                              disabled={selectedOrder?.status === 'completed'} // Disabled if order is completed
                              error={isInvalidQuantity}
                              helperText={isInvalidQuantity ? `Tối đa ${maxQuantity}` : ''}
                            />
                            <IconButton
                              color="error"
                              onClick={() => removePackage(detail.medicine_id, sp.package_id)}
                              disabled={selectedOrder?.status === 'completed'} // Disabled if order is completed
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: 'medium' }}>
                    Tổng chọn: {totalActualQuantity} / {detail.expected_quantity} {unitOfMeasure}
                    {currentUserRole === USER_ROLES.WAREHOUSE && isQuantityDeficient && selectedOrder?.status !== 'completed' && (
                      <Typography component="span" color="error" sx={{ ml: 1 }}>
                        (Thiếu {detail.expected_quantity - totalActualQuantity})
                      </Typography>
                    )}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClosePackingDialog} variant="outlined" color="secondary">
            Đóng
          </Button>
          {selectedOrder?.status !== 'completed' &&
            currentUserRole === USER_ROLES.WAREHOUSEMANAGER &&
            selectedOrder?.warehouse_manager_id?._id === currentUserId && (
              <Button variant="contained" color="primary" onClick={handleUpdatePacking}>
                Cập nhật
              </Button>
            )}
        </DialogActions>
      </Dialog>

      {/* Create Internal Export Order Dialog */}
      <Dialog open={internalDialogOpen} onClose={closeInternalDialog} maxWidth="md" fullWidth>
        <DialogTitle component="div">Tạo phiếu xuất hủy</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Button variant="outlined" onClick={addInternalLine} disabled={loadingMedicines}>
              Thêm mặt hàng
            </Button>
            {internalLines.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Chưa có mặt hàng nào. Nhấn "Thêm mặt hàng".
              </Typography>
            )}
            {internalLines.map((line, idx) => {
              const pkgList = availablePackages[line.medicine_id] || [];
              const totalPicked = totalDestroyOfLine(line);
              return (
                <Card key={idx} variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={5}>
                      <FormControl fullWidth size="small">
                        <InputLabel id={`medicine-${idx}`}>Thuốc</InputLabel>
                        <Select
                          labelId={`medicine-${idx}`}
                          label="Thuốc"
                          value={line.medicine_id}
                          onChange={(e) => changeInternalMedicine(idx, e.target.value)}
                        >
                          {medicines.map((m) => (
                            <MenuItem key={m._id} value={m._id}>
                              {m.medicine_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        type="number"
                        size="small"
                        label="SL cần hủy"
                        value={line.destroy_total}
                        onChange={(e) => setDestroyTotal(idx, e.target.value)}
                        fullWidth
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle2">Chọn thùng hàng (SL tồn, nhập SL hủy → hệ thống tính SL còn lại)</Typography>
                    <Button variant="outlined" startIcon={<QrCodeScanner />} onClick={() => handleScanPackageForLine(idx)} size="small">
                      Quét Package
                    </Button>
                  </Box>

                  {pkgList.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {line.medicine_id ? 'Chưa có thùng phù hợp hoặc chưa tải.' : 'Chọn thuốc trước.'}
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {pkgList.map((pkg) => {
                        const picked = line.picked.find((p) => p.package_id === pkg._id);
                        return (
                          <Box
                            key={pkg._id}
                            display="flex"
                            alignItems="center"
                            gap={2}
                            sx={{ p: 1, border: '1px solid', borderColor: picked ? 'primary.main' : 'grey.300', borderRadius: 1 }}
                          >
                            <Box flex={1}>
                              <Typography variant="body2" gutterBottom>
                                <strong>Batch:</strong> {pkg.batch.batch_code} | <strong>Tồn:</strong> {pkg.quantity} |{' '}
                                <strong>Vị trí:</strong> {pkg.location.area_name || ''}-{pkg.location.bay || ''}-{pkg.location.row || ''}-
                                {pkg.location.column || ''}
                              </Typography>
                              <Tooltip title={`Full Package ID: ${pkg._id}`} arrow>
                                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 'medium', cursor: 'help' }}>
                                  📦 Package ID: ...{pkg._id.slice(-6)}
                                </Typography>
                              </Tooltip>
                            </Box>
                            {picked ? (
                              <>
                                <TextField
                                  type="number"
                                  size="small"
                                  label="SL hủy"
                                  value={picked.destroy_qty}
                                  onChange={(e) => changeDestroyQty(idx, pkg._id, e.target.value)}
                                  inputProps={{ min: 0, max: picked.max }}
                                  sx={{ width: 110 }}
                                />
                                <Typography variant="body2" sx={{ minWidth: 120 }}>
                                  Còn lại: {picked.remaining_after}
                                </Typography>
                                <IconButton color="error" onClick={() => removePickPackage(idx, pkg._id)} size="small">
                                  <Delete fontSize="small" />
                                </IconButton>
                              </>
                            ) : (
                              <Button variant="text" onClick={() => addPickPackage(idx, pkg._id)}>
                                Chọn
                              </Button>
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  )}

                  <Typography variant="body2" sx={{ mt: 2 }}>
                    Đã phân bổ hủy: {totalPicked} / {line.destroy_total}
                    {totalPicked !== line.destroy_total && (
                      <Typography component="span" color="error" sx={{ ml: 1 }}>
                        {totalPicked < line.destroy_total
                          ? `(Chưa đủ ${line.destroy_total - totalPicked})`
                          : `(Thừa ${totalPicked - line.destroy_total})`}
                      </Typography>
                    )}
                  </Typography>

                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button color="error" onClick={() => removeInternalLine(idx)}>
                      Xóa dòng
                    </Button>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeInternalDialog}>
            Đóng
          </Button>
          <Button variant="contained" onClick={submitInternalOrder} disabled={!canSubmitInternal || creatingInternal}>
            {creatingInternal ? 'Đang tạo...' : 'Tạo đơn'}
          </Button>
        </DialogActions>
      </Dialog>

      <ModalConfirm
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false, loading: false })}
        onConfirm={confirmDialog.onConfirm}
        loading={confirmDialog.loading}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
      />
      <ModalConfirm
        open={messageDialog.open}
        title={messageDialog.title}
        content={messageDialog.content}
        onCancel={() => setMessageDialog({ ...messageDialog, open: false })}
        onConfirm={() => setMessageDialog({ ...messageDialog, open: false })}
        confirmText="Đóng"
        cancelText=""
      />
    </Box>
  );
}
