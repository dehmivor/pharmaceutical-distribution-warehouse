"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import { Add, Delete, CheckCircle, Cancel, Inventory } from "@mui/icons-material";
import ModalConfirm from "../../../../views/general/ModalConfirm";

const USER_ROLES = {
  WAREHOUSEMANAGER: "warehouse_manager",
  WAREHOUSE: "warehouse",
};

export default function ManagePackaging() {
  const router = useRouter();
  const [exportOrders, setExportOrders] = useState([]);
  const [warehouseStaffs, setWarehouseStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffLoading, setStaffLoading] = useState(false);
  const [packingDialogOpen, setPackingDialogOpen] = useState(false);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [packingDetails, setPackingDetails] = useState([]);
  const [availablePackages, setAvailablePackages] = useState({});
  const [showingPackageListFor, setShowingPackageListFor] = useState(null);
  const [activeTab, setActiveTab] = useState("approved");
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: () => { },
    confirmText: "Đồng ý",
    cancelText: "Hủy",
    loading: false,
  });
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: "Thông báo",
    content: "",
  });

  const getAuthToken = () => localStorage.getItem("auth-token");

  // Tính tổng giá trị đơn hàng
  const calculateTotalValue = (order) => {
    if (!order?.details) return 0;
    return order.details.reduce((total, detail) => {
      const actualQuantity = detail.actual_item.reduce((sum, item) => sum + item.quantity, 0);
      return total + actualQuantity * detail.unit_price;
    }, 0);
  };

  // Format tiền VNĐ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
  };

  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      setIsRoleLoading(true);
      const token = getAuthToken();
      if (!token) {
        router.push("/auth/login");
        setIsRoleLoading(false);
        return;
      }
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/auth/login");
          }
          throw new Error("Failed to fetch current user role");
        }
        const data = await res.json();
        setCurrentUserRole(data.data.role);
        setCurrentUserId(data.data.userId);
      } catch (error) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Lỗi khi tải vai trò người dùng." });
      } finally {
        setIsRoleLoading(false);
      }
    };
    fetchCurrentUserRole();
  }, [router]);

  const fetchWarehouseStaff = async () => {
    setStaffLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${backendUrl}/api/users?role=warehouse`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch warehouse staff");
      }
      const data = await res.json();
      setWarehouseStaffs(data.data);
    } catch (error) {
      setWarehouseStaffs([
        { _id: "s1", email: "staff1@company.com", role: "warehouse" },
        { _id: "s2", email: "staff2@company.com", role: "warehouse" },
        { _id: "s3", email: "staff3@company.com", role: "warehouse" },
      ]);
    } finally {
      setStaffLoading(false);
    }
  };

  const fetchExportOrders = async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`${backendUrl}/api/export-orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch export orders");
      }
      const data = await res.json();
      setExportOrders(data.data);
    } catch (error) {
      setExportOrders([
        {
          _id: "1",
          contract_id: { _id: "c1", contract_code: "HD001" },
          status: "approved",
          created_by: { _id: "u1", email: "admin@company.com" },
          details: [
            {
              medicine_id: { _id: "m1", medicine_name: "Paracetamol 500mg", unit_of_measure: "viên" },
              expected_quantity: 1000,
              actual_item: [],
              unit_price: 500,
            },
            {
              medicine_id: { _id: "m2", medicine_name: "Amoxicillin 250mg", unit_of_measure: "viên" },
              expected_quantity: 500,
              actual_item: [
                {
                  package_id: {
                    _id: "p1",
                    package_code: "PKG001",
                    batch: { _id: "b1", batch_code: "BATCH001", expiry_date: "2026-01-01" },
                    location: { area_name: "Kho lạnh", bay: "A", row: "1", column: "2" },
                  },
                  quantity: 200,
                  created_by: { _id: "s1" },
                },
              ],
              unit_price: 1200,
            },
          ],
          createdAt: "2024-01-15T10:00:00Z",
          note: "Giao hàng trước 20/01/2024",
        },
        {
          _id: "2",
          contract_id: { _id: "c2", contract_code: "HD002" },
          status: "completed",
          created_by: { _id: "u2", email: "sales@company.com" },
          warehouse_manager_id: { _id: "s1", email: "staff1@company.com" },
          details: [
            {
              medicine_id: { _id: "m3", medicine_name: "Vitamin C 1000mg", unit_of_measure: "viên" },
              expected_quantity: 200,
              actual_item: [
                {
                  package_id: {
                    _id: "p3",
                    package_code: "PKG003",
                    batch: { _id: "b3", batch_code: "BATCH003", expiry_date: "2025-12-31" },
                    location: { area_name: "Kho thường", bay: "B", row: "2", column: "3" },
                  },
                  quantity: 180,
                  created_by: { _id: "s1" },
                },
              ],
              unit_price: 800,
            },
          ],
          createdAt: "2024-01-14T14:30:00Z",
          completedAt: "2024-01-16T09:00:00Z",
          note: "Đơn hàng ưu tiên",
        },
      ]);
      setMessageDialog({ open: true, title: "Lỗi", content: "Lỗi khi tải danh sách đơn hàng xuất kho." });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePackages = async (medicineId) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const token = getAuthToken();
    if (!token) throw new Error("No auth token found");
    const res = await fetch(`${backendUrl}/api/packages/${medicineId}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to fetch packages");
    }
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Failed to fetch packages");
    const packages = data.data.flatMap((batchGroup) =>
      batchGroup.packages
        .filter((pkg) => pkg.quantity > 0)
        .map((pkg) => ({
          ...pkg,
          batch: batchGroup.batch,
        }))
    );
    return packages;
  };

  useEffect(() => {
    if (!isRoleLoading && currentUserRole) {
      fetchExportOrders();
      fetchWarehouseStaff();
    }
  }, [isRoleLoading, currentUserRole]);

  useEffect(() => {
    if (selectedOrder) {
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
          setMessageDialog({ open: true, title: "Lỗi", content: "Lỗi khi tải danh sách gói hàng." });
        }
      };
      fetchPackages();
    }
  }, [selectedOrder]);

  const handleOpenViewDetailsDialog = (order) => {
    setSelectedOrder(order);
    setViewDetailsDialogOpen(true);
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
          created_by: item.created_by._id || item.created_by,
        })),
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
            selected_packages: detail.selected_packages.map((sp) =>
              sp.package_id === packageId ? { ...sp, quantity } : sp
            ),
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
            selected_packages: [
              ...detail.selected_packages,
              { package_id: packageId, quantity: 0, created_by: currentUserId },
            ],
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
            selected_packages: detail.selected_packages.filter((sp) => sp.package_id !== packageId),
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
        setMessageDialog({ open: true, title: "Lỗi", content: "Thiếu ID thuốc trong chi tiết đóng gói." });
        return;
      }
      if (!detail.selected_packages || !Array.isArray(detail.selected_packages)) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Danh sách gói hàng phải là mảng." });
        return;
      }
      for (const sp of detail.selected_packages) {
        if (!sp.package_id) {
          setMessageDialog({ open: true, title: "Lỗi", content: "Thiếu ID gói hàng trong danh sách đã chọn." });
          return;
        }
        if (typeof sp.quantity !== "number" || sp.quantity < 0) {
          setMessageDialog({ open: true, title: "Lỗi", content: "Số lượng phải là số không âm." });
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
        title: "Xác nhận tiếp tục",
        content: "Một số mặt hàng chưa đạt số lượng yêu cầu. Bạn có muốn tiếp tục cập nhật không?",
        onConfirm: async () => {
          await performUpdatePacking();
          setConfirmDialog({ ...confirmDialog, open: false });
        },
        confirmText: "Tiếp tục",
        cancelText: "Hủy",
        loading: false,
      });
      return;
    }
    await performUpdatePacking();
  };

  const performUpdatePacking = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getAuthToken();
      if (!token) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." });
        return;
      }
      const payloadDetails = packingDetails.map((detail) => ({
        medicine_id: detail.medicine_id,
        expected_quantity: detail.expected_quantity,
        unit_price: detail.unit_price,
        actual_item: detail.selected_packages.map((sp) => ({
          package_id: sp.package_id,
          quantity: sp.quantity,
          created_by: sp.created_by,
        })),
      }));
      const res = await fetch(`${backendUrl}/api/export-orders/${selectedOrder._id}/update-packing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ details: payloadDetails }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update packing");
      }
      const updatedOrder = await res.json();
      setExportOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)));
      handleClosePackingDialog();
      setMessageDialog({ open: true, title: "Thành công", content: "Cập nhật đóng gói thành công!" });
    } catch (error) {
      setMessageDialog({ open: true, title: "Lỗi", content: `Cập nhật đóng gói thất bại: ${error.message || ""}` });
    } finally {
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCompleteOrder = async (orderId) => {
    const order = exportOrders.find((o) => o._id === orderId);
    if (!order) {
      setMessageDialog({ open: true, title: "Lỗi", content: "Không tìm thấy đơn hàng!" });
      return;
    }
    if (order.status !== "approved") {
      setMessageDialog({ open: true, title: "Lỗi", content: "Đơn hàng phải được duyệt trước khi hoàn thành!" });
      return;
    }
    setConfirmDialog({
      open: true,
      title: "Xác nhận hoàn thành",
      content:
        "Bạn có chắc chắn muốn hoàn thành đơn hàng này không? Số lượng gói hàng sẽ được cập nhật và thay đổi vị trí sẽ được ghi lại.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const token = getAuthToken();
          if (!token) {
            setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." });
            return;
          }
          const res = await fetch(`${backendUrl}/api/export-orders/${orderId}/complete`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Không thể hoàn thành đơn hàng");
          }
          const updatedOrder = await res.json();
          setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)));
          setMessageDialog({ open: true, title: "Thành công", content: "Đơn hàng đã hoàn thành!" });
        } catch (error) {
          setMessageDialog({
            open: true,
            title: "Lỗi",
            content: `Hoàn thành đơn hàng thất bại: ${error.message || ""}`,
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
          handleCloseViewDetailsDialog();
        }
      },
      confirmText: "Hoàn thành",
      cancelText: "Hủy",
      loading: false,
    });
  };

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Xác nhận hủy",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }));
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const token = getAuthToken();
          if (!token) {
            setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." });
            return;
          }
          const res = await fetch(`${backendUrl}/api/export-orders/${orderId}/cancel`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to cancel order");
          }
          const updatedOrder = await res.json();
          setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)));
          setMessageDialog({ open: true, title: "Thành công", content: "Đơn hàng đã được hủy!" });
        } catch (error) {
          setMessageDialog({ open: true, title: "Lỗi", content: `Hủy đơn hàng thất bại: ${error.message || ""}` });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }));
          handleCloseViewDetailsDialog();
        }
      },
      confirmText: "Hủy đơn",
      cancelText: "Quay lại",
      loading: false,
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: "Đã duyệt", color: "primary" },
      completed: { label: "Hoàn thành", color: "success" },
      cancelled: { label: "Đã hủy", color: "error" },
    };
    const config = statusConfig[status] || statusConfig.approved;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const approvedOrders = exportOrders.filter((order) => order.status === "approved");
  const completedOrders = exportOrders.filter((order) => order.status === "completed");
  const cancelledOrders = exportOrders.filter((order) => order.status === "cancelled");

  if (loading || isRoleLoading || !currentUserRole) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Card variant="outlined" sx={{ mb: 4, p: 3, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom color="primary.main">
          Quản lý Kho Dược phẩm
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Phân công nhân viên và quản lý đóng gói đơn hàng xuất kho
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Vai trò hiện tại: {currentUserRole}
        </Typography>
      </Card>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" color="text.secondary">
                  Chờ xử lý
                </Typography>
                <Inventory color="action" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {approvedOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" color="text.secondary">
                  Đã phân công
                </Typography>
                <Inventory color="action" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {approvedOrders.filter((order) => order.warehouse_manager_id).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" color="text.secondary">
                  Hoàn thành
                </Typography>
                <CheckCircle color="success" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {completedOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1" color="text.secondary">
                  Đã hủy
                </Typography>
                <Cancel color="error" />
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {cancelledOrders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs and Order Table */}
      <Card elevation={2} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          aria-label="Order status tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label={`Chờ xử lý (${approvedOrders.length})`} value="approved" />
          <Tab label={`Hoàn thành (${completedOrders.length})`} value="completed" />
          <Tab label={`Đã hủy (${cancelledOrders.length})`} value="cancelled" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {activeTab === "approved" && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table aria-label="Approved orders table">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Số hợp đồng</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Người tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Nhân viên phụ trách</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        Không có đơn hàng chờ xử lý.
                      </TableCell>
                    </TableRow>
                  ) : (
                    approvedOrders.map((order, idx) => (
                      <TableRow key={order._id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{order.contract_id?.contract_code || "N/A"}</TableCell>
                        <TableCell>{order.created_by.email}</TableCell>
                        <TableCell>
                          {order.warehouse_manager_id ? order.warehouse_manager_id.email : "Chưa phân công"}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" onClick={() => handleOpenViewDetailsDialog(order)}>
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === "completed" && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table aria-label="Completed orders table">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Số hợp đồng</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Người tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        Không có đơn hàng đã hoàn thành.
                      </TableCell>
                    </TableRow>
                  ) : (
                    completedOrders.map((order, idx) => (
                      <TableRow key={order._id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{order.contract_id?.contract_code || "N/A"}</TableCell>
                        <TableCell>{order.created_by.email}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" onClick={() => handleOpenViewDetailsDialog(order)}>
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === "cancelled" && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table aria-label="Cancelled orders table">
                <TableHead sx={{ bgcolor: "grey.100" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>STT</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Số hợp đồng</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Người tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Ngày tạo</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Hành động</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cancelledOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        Không có đơn hàng đã hủy.
                      </TableCell>
                    </TableRow>
                  ) : (
                    cancelledOrders.map((order, idx) => (
                      <TableRow key={order._id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{order.contract_id?.contract_code || "N/A"}</TableCell>
                        <TableCell>{order.created_by.email}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</TableCell>
                        <TableCell>
                          <Button variant="outlined" size="small" onClick={() => handleOpenViewDetailsDialog(order)}>
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onClose={handleCloseViewDetailsDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Chi tiết Đơn hàng Xuất kho</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {selectedOrder && (
            <Box>
              {/* Thông tin tổng quan */}
              <Typography variant="h6" gutterBottom>
                Thông tin đơn hàng
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mã đơn hàng:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder._id || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Mã hợp đồng:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedOrder.contract_id?.contract_code || "N/A"}
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
                    {selectedOrder.warehouse_manager_id?.email || "Chưa phân công"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Trạng thái:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {getStatusBadge(selectedOrder.status)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Ngày tạo:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("vi-VN")}
                  </Typography>
                </Grid>
                {(selectedOrder.status === "completed" || selectedOrder.status === "cancelled") && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {selectedOrder.status === "completed" ? "Ngày hoàn thành:" : "Ngày hủy:"}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedOrder.completedAt || selectedOrder.cancelledAt
                        ? new Date(selectedOrder.completedAt || selectedOrder.cancelledAt).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tổng giá trị:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" color="primary.main">
                    {formatCurrency(calculateTotalValue(selectedOrder))}
                  </Typography>
                </Grid>
                {selectedOrder.note && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Ghi chú:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedOrder.note || "Không có ghi chú"}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Chi tiết mặt hàng */}
              <Typography variant="h6" gutterBottom>
                Chi tiết mặt hàng
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small" aria-label="Order details table">
                  <TableHead sx={{ bgcolor: "grey.50" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Thuốc</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>SL Yêu cầu</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>SL Thực tế</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Đơn vị</TableCell>
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
          {(currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
            <Button
              variant="outlined"
              color="info"
              onClick={() => {
                handleOpenPackingDialog(selectedOrder);
              }}
            >
              Đóng gói
            </Button>
          )}
          {currentUserRole === USER_ROLES.WAREHOUSEMANAGER && (
            <>
              <Button variant="contained" color="primary" onClick={() => handleCompleteOrder(selectedOrder._id)}>
                Hoàn thành
              </Button>
              <Button variant="contained" color="error" onClick={() => handleCancelOrder(selectedOrder._id)}>
                Hủy
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Packing Dialog */}
      <Dialog
        open={packingDialogOpen && (currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER)}
        onClose={handleClosePackingDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>Chi tiết Đóng gói</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedOrder?.status === "completed"
              ? `Xem chi tiết đóng gói cho đơn hàng `
              : `Chọn thùng hàng và nhập số lượng thực tế cho đơn hàng `}
            <Typography component="span" fontWeight="medium">
              {selectedOrder?.contract_id?.contract_code || "N/A"}
            </Typography>
          </Typography>
          <Box sx={{ maxHeight: 450, overflowY: "auto", mt: 2, pr: 1 }}>
            {packingDetails.map((detail) => {
              const medicineName =
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id.medicine_name ||
                "Không xác định";
              const unitOfMeasure =
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id.unit_of_measure ||
                "Không xác định";
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
                              bgcolor: "grey.50",
                              p: 1.5,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: isInvalidQuantity ? "error.main" : "grey.200",
                            }}
                          >
                            <Typography variant="body2" flex={1}>
                              {pkg
                                ? `${pkg.batch.batch_code}, Vị trí: ${pkg.location.area_name || "N/A"} - ${pkg.location.bay || "N/A"} - ${pkg.location.row || "N/A"
                                } - ${pkg.location.column || "N/A"} (Còn: ${pkg.quantity})`
                                : "Gói không xác định"}
                            </Typography>
                            <TextField
                              type="number"
                              size="small"
                              inputProps={{ min: 0, max: maxQuantity }}
                              value={sp.quantity}
                              onChange={(e) => handleQuantityChange(detail.medicine_id, sp.package_id, e.target.value)}
                              sx={{ width: 90 }}
                              disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER || selectedOrder?.status === "completed"}
                              error={isInvalidQuantity}
                              helperText={isInvalidQuantity ? `Tối đa ${maxQuantity}` : ""}
                            />
                            <IconButton
                              color="error"
                              onClick={() => removePackage(detail.medicine_id, sp.package_id)}
                              disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER || selectedOrder?.status === "completed"}
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() => setShowingPackageListFor(detail.medicine_id)}
                    disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER || selectedOrder?.status === "completed"}
                    sx={{ mb: 2 }}
                  >
                    Thêm thùng hàng
                  </Button>
                  {showingPackageListFor === detail.medicine_id && (
                    <Box sx={{ mt: 2, border: 1, borderColor: "divider", p: 2, borderRadius: 1, bgcolor: "grey.50" }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Thùng hàng có sẵn:
                      </Typography>
                      {availablePackages[detail.medicine_id]?.filter(
                        (pkg) => !detail.selected_packages.some((sp) => sp.package_id === pkg._id)
                      ).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Không có thùng hàng nào khác có sẵn.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {availablePackages[detail.medicine_id]
                            ?.filter((pkg) => !detail.selected_packages.some((sp) => sp.package_id === pkg._id))
                            .map((pkg) => (
                              <Box
                                key={pkg._id}
                                display="flex"
                                alignItems="center"
                                gap={2}
                                sx={{
                                  p: 1,
                                  bgcolor: "background.paper",
                                  borderRadius: 1,
                                  border: "1px solid",
                                  borderColor: "grey.200",
                                }}
                              >
                                <Typography variant="body2" flex={1}>
                                  {pkg.batch.batch_code} - Vị trí: {pkg.location.area_name || "N/A"} (Kệ: {pkg.location.bay || "N/A"}, Hàng: {pkg.location.row || "N/A"}, Cột: {pkg.location.column || "N/A"}) (Còn: {pkg.quantity})
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="primary"
                                  onClick={() => addPackage(detail.medicine_id, pkg._id)}
                                  disabled={selectedOrder?.status === "completed"}
                                >
                                  Chọn
                                </Button>
                              </Box>
                            ))}
                        </Stack>
                      )}
                      <Button variant="text" size="small" onClick={() => setShowingPackageListFor(null)} sx={{ mt: 1 }}>
                        Hủy chọn
                      </Button>
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ mt: 2, fontWeight: "medium" }}>
                    Tổng chọn: {totalActualQuantity} / {detail.expected_quantity} {unitOfMeasure}
                    {currentUserRole === USER_ROLES.WAREHOUSE && isQuantityDeficient && selectedOrder?.status !== "completed" && (
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
          {(currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdatePacking}
              disabled={selectedOrder?.status === "completed"}
            >
              Cập nhật
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
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

      {/* Message Dialog */}
      <ModalConfirm
        open={messageDialog.open}
        title={messageDialog.title}
        content={messageDialog.content}
        onCancel={() => setMessageDialog({ ...messageDialog, open: false })}
        onConfirm={() => setMessageDialog({ ...messageDialog, open: false })}
        confirmText="Đóng"
        cancelText=""
      />
    </Container>
  );
}