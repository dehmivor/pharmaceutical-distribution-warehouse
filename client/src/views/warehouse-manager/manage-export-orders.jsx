"use client"

import { Refresh as RefreshIcon, Search as SearchIcon } from "@mui/icons-material"
import MoreVertIcon from "@mui/icons-material/MoreVert"
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
  Menu, // Keep Menu for MoreVertIcon
  Dialog, // For View Details and Packing Dialogs
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  Divider,
} from "@mui/material"
import { Add, Delete } from "@mui/icons-material" // Icons for dialogs
import axios from "axios"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ModalConfirm from "../../views/general/ModalConfirm" // Assuming this path for ModalConfirm

const USER_ROLES = {
  WAREHOUSEMANAGER: "warehouse_manager",
  WAREHOUSE: "warehouse",
}

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

// Replaced getStatusColor with getStatusBadge for more detailed status display
const getStatusBadge = (status) => {
  const statusConfig = {
    draft: { label: "Nháp", color: "default" },
    approved: { label: "Đã duyệt", color: "primary" },
    returned: { label: "Đã trả lại", color: "info" },
    rejected: { label: "Đã từ chối", color: "warning" },
    completed: { label: "Hoàn thành", color: "success" },
    cancelled: { label: "Đã hủy", color: "error" },
  }
  const config = statusConfig[status] || { label: status, color: "default" }
  return <Chip label={config.label} color={config.color} size="small" />
}

export default function ManageExportOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null) // Keep for Snackbar, though messageDialog is preferred for new logic
  const [filterDate, setFilterDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [anchorEl, setAnchorEl] = useState(null) // For MoreVertIcon menu
  const [menuOrder, setMenuOrder] = useState(null) // For MoreVertIcon menu

  // pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  // States for View Details Dialog (from managePacking.js)
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // States for Packing Dialog (from managePacking.js)
  const [packingDialogOpen, setPackingDialogOpen] = useState(false)
  const [packingDetails, setPackingDetails] = useState([])
  const [availablePackages, setAvailablePackages] = useState({})
  const [showingPackageListFor, setShowingPackageListFor] = useState(null)

  // States for User Role and ID (from managePacking.js)
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)

  // States for Confirmation and Message Dialogs (from managePacking.js)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    onConfirm: () => {},
    confirmText: "Đồng ý",
    cancelText: "Hủy",
    loading: false,
  })
  const [messageDialog, setMessageDialog] = useState({
    open: false,
    title: "Thông báo",
    content: "",
  })

  // Helper functions (from managePacking.js)
  const getAuthToken = () => localStorage.getItem("auth-token")

  const calculateTotalValue = (order) => {
    if (!order?.details) return 0
    return order.details.reduce((total, detail) => {
      const actualQuantity = detail.actual_item.reduce((sum, item) => sum + item.quantity, 0)
      return total + actualQuantity * detail.unit_price
    }, 0)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
  }

  // Menu handlers for MoreVertIcon
  const handleMenuOpen = (e, order) => {
    setAnchorEl(e.currentTarget)
    setMenuOrder(order)
  }
  const handleMenuClose = () => {
    setAnchorEl(null)
    setMenuOrder(null)
  }

  // Fetch current user role (from managePacking.js)
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      setIsRoleLoading(true)
      const token = getAuthToken()
      if (!token) {
        router.push("/auth/login")
        setIsRoleLoading(false)
        return
      }
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            router.push("/auth/login")
          }
          throw new Error("Failed to fetch current user role")
        }
        const data = await res.json()
        setCurrentUserRole(data.data.role)
        setCurrentUserId(data.data.userId)
      } catch (error) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Lỗi khi tải vai trò người dùng." })
      } finally {
        setIsRoleLoading(false)
      }
    }
    fetchCurrentUserRole()
  }, [router])

  const fetchOrders = async (p = null, rpp = null, date = null, status = null) => {
    setLoading(true)
    setError(null) // Reset error for Snackbar
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const currentPage = p !== null ? p : page
      const currentLimit = rpp !== null ? rpp : rowsPerPage
      const currentDate = date !== null ? date : filterDate
      const currentStatus = status !== null ? status : filterStatus
      // allow multiple status values if needed; here just one
      // Original logic had 'approved' default if currentStatus is empty.
      // To fetch all statuses when filterStatus is empty, remove the statusParams array and conditional append.
      // If currentStatus is empty, no 'status' query param is sent, fetching all.
      // If currentStatus is selected, it sends that specific status.

      const qp = new URLSearchParams()
      qp.append("page", (currentPage + 1).toString())
      qp.append("limit", currentLimit.toString())
      if (currentDate) qp.append("createdAt", currentDate)
      if (currentStatus) qp.append("status", currentStatus)

      const url = `${backendUrl}/api/export-orders${qp.toString() ? `?${qp.toString()}` : ""}`
      const resp = await axios.get(url, { headers: getAuthHeaders() })
      if (!resp.data.success) {
        throw new Error(resp.data.error || "Failed to load export orders")
      }
      const data = resp.data.data || []
      setOrders(data)
      // derive total count
      const pag = resp.data.pagination
      setTotalCount(pag?.total ?? data.length)
    } catch (err) {
      setError(err.response?.data?.error || err.message) // Set error for Snackbar
      setMessageDialog({ open: true, title: "Lỗi", content: err.response?.data?.error || err.message }) // Also use messageDialog
      setOrders([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // Fetch available packages for packing dialog (from managePacking.js)
  const fetchAvailablePackages = async (medicineId) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const token = getAuthToken()
    if (!token) throw new Error("No auth token found")
    const res = await fetch(`${backendUrl}/api/packages/${medicineId}/packages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.message || "Failed to fetch packages")
    }
    const data = await res.json()
    if (!data.success) throw new Error(data.message || "Failed to fetch packages")
    const packages = data.data.flatMap((batchGroup) =>
      batchGroup.packages
        .filter((pkg) => pkg.quantity > 0)
        .map((pkg) => ({
          ...pkg,
          batch: batchGroup.batch,
        })),
    )
    return packages
  }

  // Main useEffect for fetching orders, now dependent on user role
  useEffect(() => {
    if (!isRoleLoading && currentUserRole) {
      fetchOrders()
    }
  }, [page, rowsPerPage, filterDate, filterStatus, isRoleLoading, currentUserRole])

  // Effect to fetch packages when selectedOrder changes for packing dialog (from managePacking.js)
  useEffect(() => {
    if (selectedOrder && packingDialogOpen) {
      const fetchPackages = async () => {
        try {
          const medicineIds = selectedOrder.details.map((detail) => detail.medicine_id._id)
          const packagesPromises = medicineIds.map((medicineId) => fetchAvailablePackages(medicineId))
          const packagesResults = await Promise.all(packagesPromises)
          const availablePackagesTemp = {}
          medicineIds.forEach((medicineId, index) => {
            availablePackagesTemp[medicineId] = packagesResults[index]
          })
          setAvailablePackages(availablePackagesTemp)
        } catch (error) {
          setMessageDialog({ open: true, title: "Lỗi", content: "Lỗi khi tải danh sách gói hàng." })
        }
      }
      fetchPackages()
    }
  }, [selectedOrder, packingDialogOpen])

  const handleChangePage = useCallback((_, newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((e) => {
    setRowsPerPage(Number.parseInt(e.target.value, 10))
    setPage(0)
  }, [])

  const handleSearchClick = useCallback(() => {
    setPage(0)
    fetchOrders(0, rowsPerPage, filterDate, filterStatus)
  }, [rowsPerPage, filterDate, filterStatus])

  const handleRefresh = useCallback(() => {
    fetchOrders(page, rowsPerPage, filterDate, filterStatus)
  }, [page, rowsPerPage, filterDate, filterStatus])

  const handleReset = useCallback(() => {
    setFilterDate("")
    setFilterStatus("")
    setPage(0)
  }, [])

  // View Details Dialog Handlers (from managePacking.js)
  const handleOpenViewDetailsDialog = (order) => {
    setSelectedOrder(order)
    setViewDetailsDialogOpen(true)
    handleMenuClose() // Close the MoreVertIcon menu
  }

  const handleCloseViewDetailsDialog = () => {
    setViewDetailsDialogOpen(false)
    setSelectedOrder(null)
  }

  // Packing Dialog Handlers (from managePacking.js)
  const handleOpenPackingDialog = (order) => {
    setSelectedOrder(order)
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
      })),
    )
    setPackingDialogOpen(true)
  }

  const handleClosePackingDialog = () => {
    setPackingDialogOpen(false)
    setPackingDetails([])
    setAvailablePackages({})
    setShowingPackageListFor(null)
  }

  const handleQuantityChange = (medicineId, packageId, value) => {
    const quantity = Number.parseInt(value) || 0
    setPackingDetails((prev) =>
      prev.map((detail) =>
        detail.medicine_id === medicineId
          ? {
              ...detail,
              selected_packages: detail.selected_packages.map((sp) =>
                sp.package_id === packageId ? { ...sp, quantity } : sp,
              ),
            }
          : detail,
      ),
    )
  }

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
          : detail,
      ),
    )
    setShowingPackageListFor(null)
  }

  const removePackage = (medicineId, packageId) => {
    setPackingDetails((prev) =>
      prev.map((detail) =>
        detail.medicine_id === medicineId
          ? {
              ...detail,
              selected_packages: detail.selected_packages.filter((sp) => sp.package_id !== packageId),
            }
          : detail,
      ),
    )
  }

  const handleUpdatePacking = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    for (const detail of packingDetails) {
      if (!detail.medicine_id) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Thiếu ID thuốc trong chi tiết đóng gói." })
        return
      }
      if (!detail.selected_packages || !Array.isArray(detail.selected_packages)) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Danh sách gói hàng phải là mảng." })
        return
      }
      for (const sp of detail.selected_packages) {
        if (!sp.package_id) {
          setMessageDialog({ open: true, title: "Lỗi", content: "Thiếu ID gói hàng trong danh sách đã chọn." })
          return
        }
        if (typeof sp.quantity !== "number" || sp.quantity < 0) {
          setMessageDialog({ open: true, title: "Lỗi", content: "Số lượng phải là số không âm." })
          return
        }
        if (!sp.created_by) {
          sp.created_by = currentUserId
        }
      }
    }

    const allQuantitiesMatch = packingDetails.every((detail) => {
      const totalActual = detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0)
      return totalActual >= detail.expected_quantity
    })

    if (currentUserRole === USER_ROLES.WAREHOUSE && !allQuantitiesMatch) {
      setConfirmDialog({
        open: true,
        title: "Xác nhận tiếp tục",
        content: "Một số mặt hàng chưa đạt số lượng yêu cầu. Bạn có muốn tiếp tục cập nhật không?",
        onConfirm: async () => {
          await performUpdatePacking()
          setConfirmDialog({ ...confirmDialog, open: false })
        },
        confirmText: "Tiếp tục",
        cancelText: "Hủy",
        loading: false,
      })
      return
    }
    await performUpdatePacking()
  }

  const performUpdatePacking = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }))
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." })
        return
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
      }))
      const res = await fetch(`${backendUrl}/api/export-orders/${selectedOrder._id}/update-packing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ details: payloadDetails }),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update packing")
      }
      const updatedOrder = await res.json()
      setOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)))
      handleClosePackingDialog()
      setMessageDialog({ open: true, title: "Thành công", content: "Cập nhật đóng gói thành công!" })
    } catch (error) {
      setMessageDialog({ open: true, title: "Lỗi", content: `Cập nhật đóng gói thất bại: ${error.message || ""}` })
    } finally {
      setConfirmDialog((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleCompleteOrder = async (orderId) => {
    const order = orders.find((o) => o._id === orderId)
    if (!order) {
      setMessageDialog({ open: true, title: "Lỗi", content: "Không tìm thấy đơn hàng!" })
      return
    }
    if (order.status !== "approved") {
      setMessageDialog({ open: true, title: "Lỗi", content: "Đơn hàng phải được duyệt trước khi hoàn thành!" })
      return
    }
    setConfirmDialog({
      open: true,
      title: "Xác nhận hoàn thành",
      content:
        "Bạn có chắc chắn muốn hoàn thành đơn hàng này không? Số lượng gói hàng sẽ được cập nhật và thay đổi vị trí sẽ được ghi lại.",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          const token = getAuthToken()
          if (!token) {
            setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." })
            return
          }
          const res = await fetch(`${backendUrl}/api/export-orders/${orderId}/complete`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.message || "Không thể hoàn thành đơn hàng")
          }
          const updatedOrder = await res.json()
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
          setMessageDialog({ open: true, title: "Thành công", content: "Đơn hàng đã hoàn thành!" })
        } catch (error) {
          setMessageDialog({
            open: true,
            title: "Lỗi",
            content: `Hoàn thành đơn hàng thất bại: ${error.message || ""}`,
          })
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          handleCloseViewDetailsDialog()
        }
      },
      confirmText: "Hoàn thành",
      cancelText: "Hủy",
      loading: false,
    })
  }

  const handleCancelOrder = async (orderId) => {
    setConfirmDialog({
      open: true,
      title: "Xác nhận hủy",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          const token = getAuthToken()
          if (!token) {
            setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." })
            return
          }
          const res = await fetch(`${backendUrl}/api/export-orders/${orderId}/cancel`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || "Failed to cancel order")
          }
          const updatedOrder = await res.json()
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
          setMessageDialog({ open: true, title: "Thành công", content: "Đơn hàng đã được hủy!" })
        } catch (error) {
          setMessageDialog({ open: true, title: "Lỗi", content: `Hủy đơn hàng thất bại: ${error.message || ""}` })
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
          handleCloseViewDetailsDialog()
        }
      },
      confirmText: "Hủy đơn",
      cancelText: "Quay lại",
      loading: false,
    })
  }

  // New function to assign order to current user
  const handleAssignToMyself = async (orderId) => {
    handleMenuClose() // Close the menu immediately
    setConfirmDialog({
      open: true,
      title: "Xác nhận phân công",
      content: "Bạn có chắc chắn muốn tự phân công đơn hàng này cho mình không?",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, loading: true }))
        try {
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
          const token = getAuthToken()
          if (!token) {
            setMessageDialog({ open: true, title: "Lỗi", content: "Không có token xác thực. Vui lòng đăng nhập lại." })
            return
          }

          const res = await fetch(`${backendUrl}/api/export-orders/${orderId}/assign-warehouse-manager`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ warehouse_manager_id: currentUserId }),
          })

          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || "Failed to assign warehouse manager")
          }

          const updatedOrder = await res.json()
          setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
          setMessageDialog({ open: true, title: "Thành công", content: "Đơn hàng đã được phân công cho bạn!" })
        } catch (error) {
          setMessageDialog({
            open: true,
            title: "Lỗi",
            content: `Phân công đơn hàng thất bại: ${error.message || ""}`,
          })
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false, loading: false }))
        }
      },
      confirmText: "Xác nhận",
      cancelText: "Hủy",
      loading: false,
    })
  }

  if (loading || isRoleLoading || !currentUserRole) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", height: "50vh", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    )
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4">Export Orders Management</Typography>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Export Date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            select
            label="Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            size="small"
          >
            <MenuItem value="">All</MenuItem>
            {["draft", "approved", "returned", "rejected", "completed", "cancelled"].map((s) => (
              <MenuItem key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearchClick}>
            Search
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            Reset
          </Button>
        </Stack>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export Date</TableCell>
              <TableCell>Contract Code</TableCell>
              <TableCell>Partner</TableCell>
              <TableCell>Manager Email</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No export orders found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{o.contract_id?.contract_code || "—"}</TableCell>
                  <TableCell>{o.contract_id?.partner_id?.name || "—"}</TableCell>
                  <TableCell>{o.warehouse_manager_id?.email || "—"}</TableCell>
                  <TableCell>
                    <Chip label={o.status} color={getStatusBadge(o.status).props.color} size="small" />
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
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            handleOpenViewDetailsDialog(menuOrder)
          }}
        >
          Detail
        </MenuItem>
        {/* New "Assign to myself" button */}
        {currentUserRole === USER_ROLES.WAREHOUSEMANAGER && !menuOrder?.warehouse_manager_id && (
          <MenuItem
            onClick={() => {
              handleAssignToMyself(menuOrder._id)
            }}
          >
            Assign order to myself
          </MenuItem>
        )}
      </Menu>

      {/* View Details Dialog (Integrated from managePacking.js) */}
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
                handleOpenPackingDialog(selectedOrder)
              }}
            >
              Đóng gói
            </Button>
          )}
          {currentUserRole === USER_ROLES.WAREHOUSEMANAGER && selectedOrder?.status === "approved" && (
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

      {/* Packing Dialog (Integrated from managePacking.js) */}
      <Dialog
        open={
          packingDialogOpen &&
          (currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER)
        }
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
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id
                  .medicine_name || "Không xác định"
              const unitOfMeasure =
                selectedOrder?.details.find((d) => d.medicine_id._id === detail.medicine_id)?.medicine_id
                  .unit_of_measure || "Không xác định"
              const totalActualQuantity = detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0)
              const isQuantityDeficient = totalActualQuantity < detail.expected_quantity
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
                        const pkg = availablePackages[detail.medicine_id]?.find((p) => p._id === sp.package_id)
                        const maxQuantity = pkg?.quantity || 0
                        const isInvalidQuantity = sp.quantity > maxQuantity
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
                                ? `${pkg.batch.batch_code}, Vị trí: ${pkg.location.area_name || "N/A"} - ${pkg.location.bay || "N/A"} - ${
                                    pkg.location.row || "N/A"
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
                              disabled={
                                currentUserRole === USER_ROLES.WAREHOUSEMANAGER || selectedOrder?.status === "completed"
                              }
                              error={isInvalidQuantity}
                              helperText={isInvalidQuantity ? `Tối đa ${maxQuantity}` : ""}
                            />
                            <IconButton
                              color="error"
                              onClick={() => removePackage(detail.medicine_id, sp.package_id)}
                              disabled={
                                currentUserRole === USER_ROLES.WAREHOUSEMANAGER || selectedOrder?.status === "completed"
                              }
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )
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
                        (pkg) => !detail.selected_packages.some((sp) => sp.package_id === pkg._id),
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
                                  {pkg.batch.batch_code} - Vị trí: {pkg.location.area_name || "N/A"} (Kệ:{" "}
                                  {pkg.location.bay || "N/A"}, Hàng: {pkg.location.row || "N/A"}, Cột:{" "}
                                  {pkg.location.column || "N/A"}) (Còn: {pkg.quantity})
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
                    {currentUserRole === USER_ROLES.WAREHOUSE &&
                      isQuantityDeficient &&
                      selectedOrder?.status !== "completed" && (
                        <Typography component="span" color="error" sx={{ ml: 1 }}>
                          (Thiếu {detail.expected_quantity - totalActualQuantity})
                        </Typography>
                      )}
                  </Typography>
                </Card>
              )
            })}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClosePackingDialog} variant="outlined" color="secondary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog (Integrated from managePacking.js) */}
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
      {/* Message Dialog (Integrated from managePacking.js) */}
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
  )
}
