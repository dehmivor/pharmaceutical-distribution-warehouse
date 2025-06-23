"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
  Stack,
} from "@mui/material"

import {
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Inventory as InventoryIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon, // Icon for confirm storage
} from "@mui/icons-material"

const UpdateInventoryLocation = () => {
  const [packages, setPackages] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [newLocationId, setNewLocationId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [detailDialog, setDetailDialog] = useState({ open: false, package: null })

  // Mock user ID - in real app, get from auth context
  const currentUserId = "507f1f77bcf86cd799439011"

  useEffect(() => {
    fetchPackages()
    fetchLocations()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/packages")
      const result = await response.json()

      if (result.success) {
        setPackages(result.data)
      } else {
        showSnackbar("Lỗi khi tải danh sách thùng hàng: " + result.message, "error")
      }
    } catch (error) {
      showSnackbar("Lỗi kết nối: " + error.message, "error")
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      const result = await response.json()

      if (result.success) {
        setLocations(result.data)
      } else {
        showSnackbar("Lỗi khi tải danh sách vị trí: " + result.message, "error")
      }
    } catch (error) {
      showSnackbar("Lỗi kết nối: " + error.message, "error")
    }
  }

  const handleUpdateLocation = async (packageId) => {
    if (!newLocationId) {
      showSnackbar("Vui lòng chọn vị trí mới", "warning")
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/packages/${packageId}/location`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newLocationId,
          updatedBy: currentUserId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update packages list
        setPackages(packages.map((pkg) => (pkg._id === packageId ? result.data : pkg)))

        // Reset form
        setSelectedPackage(null)
        setNewLocationId("")

        showSnackbar("Cập nhật vị trí thành công!", "success")
      } else {
        showSnackbar("Lỗi: " + result.message, "error")
      }
    } catch (error) {
      showSnackbar("Có lỗi xảy ra khi cập nhật vị trí", "error")
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmStorage = async (packageId) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/packages/${packageId}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const result = await response.json()

      if (result.success) {
        // Update packages list with new status
        setPackages(packages.map((pkg) => (pkg._id === packageId ? result.data : pkg)))

        showSnackbar("Xác nhận nhập kho thành công!", "success")
      } else {
        showSnackbar("Lỗi: " + result.message, "error")
      }
    } catch (error) {
      showSnackbar("Có lỗi xảy ra khi xác nhận nhập kho", "error")
    } finally {
      setUpdating(false)
    }
  }

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const showPackageDetail = (pkg) => {
    setDetailDialog({ open: true, package: pkg })
  }

  const handleCloseDetailDialog = () => {
    setDetailDialog({ open: false, package: null })
  }

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.package_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pkg.batch_id?.batch_code || "").toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation = !filterLocation || pkg.location_id?._id === filterLocation

    return matchesSearch && matchesLocation
  })

  const getStatusColor = (status) => {
    switch (status) {
      case "STORED":
        return "success"
      case "CHECKING":
        return "warning"
      case "DAMAGED":
        return "error"
      default:
        return "default"
    }
  }

  const getQualityStatusColor = (status) => {
    switch (status) {
      case "GOOD":
        return "success"
      case "DAMAGED":
        return "error"
      case "EXPIRED":
        return "error"
      case "PENDING":
        return "warning"
      default:
        return "default"
    }
  }

  const translateStatus = (status) => {
    switch (status) {
      case "STORED":
        return "Đã lưu kho"
      case "CHECKING":
        return "Đang kiểm tra"
      case "DAMAGED":
        return "Hư hỏng"
      case "GOOD":
        return "Tốt"
      case "PENDING":
        return "Chờ xử lý"
      case "EXPIRED":
        return "Hết hạn"
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography variant="h6">Đang tải dữ liệu...</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 3, mb: 2 }}>
        <InventoryIcon sx={{ mr: 1, verticalAlign: "middle" }} />
        Cập Nhật Vị Trí Thùng Hàng
      </Typography>

      <Paper sx={{ width: "100%", mb: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bộ Lọc & Tìm Kiếm
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tìm kiếm theo mã thùng hoặc mã lô"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: "action.active" }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Lọc theo vị trí</InputLabel>
              <Select
                value={filterLocation}
                label="Lọc theo vị trí"
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <MenuItem value="">Tất cả vị trí</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location._id} value={location._id}>
                    {location.area_id?.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredPackages.map((pkg) => (
          <Grid item xs={12} md={6} lg={4} key={pkg._id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h3">
                    <QrCodeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                    {pkg.package_code}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label={translateStatus(pkg.status)} color={getStatusColor(pkg.status)} size="small" />
                    <Chip
                      label={translateStatus(pkg.quality_status)}
                      color={getQualityStatusColor(pkg.quality_status)}
                      size="small"
                    />
                  </Stack>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Mã lô:</strong> {pkg.batch_id?.batch_code || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Số lượng:</strong> {pkg.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Kích thước:</strong> {pkg.capacity?.length} x {pkg.capacity?.width}
                  </Typography>
                  <Typography variant="body2" color="primary" gutterBottom>
                    <LocationIcon sx={{ mr: 0.5, verticalAlign: "middle", fontSize: "small" }} />
                    <strong>Vị trí hiện tại:</strong> {pkg.location_id?.position || "Chưa có"}
                    {pkg.location_id?.area_id?.name && ` - ${pkg.location_id.area_id.name}`}
                  </Typography>
                </Box>

                {selectedPackage === pkg._id ? (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Chọn vị trí mới</InputLabel>
                      <Select
                        value={newLocationId}
                        label="Chọn vị trí mới"
                        onChange={(e) => setNewLocationId(e.target.value)}
                      >
                        {locations
                          .filter((loc) => loc._id !== pkg.location_id?._id)
                          .map((location) => (
                            <MenuItem key={location._id} value={location._id}>
                              {location.position} - {location.area_id?.name}
                              {` (${location.capacity.length}x${location.capacity.width})`}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Box>
                ) : null}
              </CardContent>

              <Divider />

              <CardActions sx={{ p: 2 }}>
                {selectedPackage === pkg._id ? (
                  <Stack direction="row" spacing={1} width="100%">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SaveIcon />}
                      onClick={() => handleUpdateLocation(pkg._id)}
                      disabled={updating || !newLocationId}
                      sx={{ flex: 1 }}
                    >
                      {updating ? "Đang cập nhật..." : "Lưu"}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setSelectedPackage(null)
                        setNewLocationId("")
                      }}
                      sx={{ flex: 1 }}
                    >
                      Hủy
                    </Button>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} width="100%">
                    <Button
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => setSelectedPackage(pkg._id)}
                      sx={{ flex: 1 }}
                    >
                      Thay đổi vị trí
                    </Button>
                    <Button variant="outlined" onClick={() => showPackageDetail(pkg)}>
                      Chi tiết
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleConfirmStorage(pkg._id)}
                      disabled={updating || pkg.status === "STORED"}
                      sx={{ flex: 1 }}
                    >
                      {updating ? "Đang xử lý..." : "Xác nhận nhập kho"}
                    </Button>
                  </Stack>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredPackages.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            Không tìm thấy thùng hàng nào phù hợp với bộ lọc.
          </Typography>
        </Paper>
      )}

      {/* Package Detail Dialog */}
      <Dialog open={detailDialog.open} onClose={handleCloseDetailDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi Tiết Thùng Hàng
          <IconButton
            aria-label="close"
            onClick={handleCloseDetailDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailDialog.package && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Mã thùng:</strong> {detailDialog.package.package_code}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Mã lô:</strong> {detailDialog.package.batch_id?.batch_code || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Số lượng:</strong> {detailDialog.package.quantity}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Số lượng chuẩn:</strong> {detailDialog.package.standard_quantity}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Kích thước:</strong> {detailDialog.package.capacity?.length} x{" "}
                  {detailDialog.package.capacity?.width}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Trạng thái:</strong>{" "}
                  <Chip
                    label={translateStatus(detailDialog.package.status)}
                    color={getStatusColor(detailDialog.package.status)}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1">
                  <strong>Chất lượng:</strong>{" "}
                  <Chip
                    label={translateStatus(detailDialog.package.quality_status)}
                    color={getQualityStatusColor(detailDialog.package.quality_status)}
                    size="small"
                  />
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Vị trí hiện tại:</strong> {detailDialog.package.location_id?.position || "Chưa có"}
                  {detailDialog.package.location_id?.area_id?.name &&
                    ` - ${detailDialog.package.location_id.area_id.name}`}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Ngày tạo:</strong>{" "}
                  {detailDialog.package.created_at
                    ? new Date(detailDialog.package.created_at).toLocaleString("vi-VN")
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default UpdateInventoryLocation