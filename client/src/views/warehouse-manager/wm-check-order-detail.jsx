"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import RefreshIcon from "@mui/icons-material/Refresh"
import { useTheme } from "@mui/material/styles"

// Lấy header Authorization từ localStorage
const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "")
const formatDateTime = (d) => (d ? new Date(d).toLocaleString("vi-VN", { hour12: false }) : "")
const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "warning"
    case "processing":
      return "info"
    case "completed":
      return "success"
    case "cancelled":
      return "error"
    case "checking":
      return "primary"
    case "checked":
      return "success"
    case "draft":
      return "default"
    case "valid":
      return "success"
    case "over_expected":
      return "error"
    case "under_expected":
      return "error"
    default:
      return "default"
  }
}

export default function CheckOrderDetail() {
  const theme = useTheme()
  const { checkOrderId } = useParams()

  const [order, setOrder] = useState(null)
  const [inspections, setInspections] = useState([])
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [loadingInspections, setLoadingInspections] = useState(true)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" })

  const fetchOrder = async () => {
    setLoadingOrder(true)
    setError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      // Updated URL to match the new consolidated route structure
      const res = await axios.get(`${backendUrl}/api/inventory/check-order/${checkOrderId}`, {
        headers: getAuthHeaders(),
      })
      if (res.data.success) {
        setOrder(res.data.data.checkorder)
      } else {
        throw new Error(res.data.message || "Failed to load order")
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
      setSnackbar({ open: true, message: err.message, severity: "error" })
    } finally {
      setLoadingOrder(false)
    }
  }

  const fetchInspections = async () => {
    if (!checkOrderId) return
    setLoadingInspections(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const { data: inspectionsData } = await axios.get(
        `${backendUrl}/api/inventory-check-inspections/${checkOrderId}/inspections`,
        {
          headers: getAuthHeaders(),
        },
      )

      if (inspectionsData.success) {
        const inspectionsWithItems = await Promise.all(
          inspectionsData.data.map(async (inspection) => {
            try {
              const { data: itemsData } = await axios.get(
                `${backendUrl}/api/inventory-check-inspections/${inspection._id}/check-items`,
                {
                  headers: getAuthHeaders(),
                },
              )
              return {
                ...inspection,
                check_items: itemsData.success ? itemsData.data : [],
              }
            } catch (itemErr) {
              console.error(`Failed to load check items for inspection ${inspection._id}:`, itemErr)
              return { ...inspection, check_items: [] } // Return inspection even if items fail
            }
          }),
        )
        setInspections(inspectionsWithItems)
      } else {
        throw new Error(inspectionsData.error || "Failed to load inspections")
      }
    } catch (err) {
      setError(err.message)
      setSnackbar({ open: true, message: err.message, severity: "error" })
    } finally {
      setLoadingInspections(false)
    }
  }

  useEffect(() => {
    if (!checkOrderId) return
    fetchOrder()
    fetchInspections()
  }, [checkOrderId])

  const handleRefresh = () => {
    fetchOrder()
    fetchInspections()
  }

  const handleCompleteCheck = async () => {
    if (!order) return

    // Client-side validation logic
    const overExpectedPackages = new Set()
    const underExpectedPackages = new Set()

    inspections.forEach((inspection) => {
      inspection.check_items.forEach((item) => {
        if (item.type === "over_expected") {
          overExpectedPackages.add(item.package_id._id)
        } else if (item.type === "under_expected") {
          underExpectedPackages.add(item.package_id._id)
        }
      })
    })

    let validationFailed = false
    if (overExpectedPackages.size > 0) {
      for (const packageId of overExpectedPackages) {
        if (!underExpectedPackages.has(packageId)) {
          validationFailed = true
          break
        }
      }
    }

    if (validationFailed) {
      setSnackbar({
        open: true,
        message: "Không thể hoàn thành đơn: Một số thùng 'over_expected' không có thùng 'under_expected' tương ứng.",
        severity: "error",
      })
      return
    }

    // Proceed with API call if validation passes
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      // Updated URL to match the new consolidated route structure
      const response = await axios.patch(
        `${backendUrl}/api/inventory-check-inspections/${order._id}/status`,
        {
          status: "completed",
        },
        {
          headers: getAuthHeaders(),
        },
      )
      if (response.data.success) {
        setOrder((prev) => ({ ...prev, status: "completed" }))
        setSnackbar({ open: true, message: "Đơn kiểm kê đã được hoàn thành thành công", severity: "success" })
        fetchOrder() // Refresh order data
        fetchInspections() // Refresh inspections data
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Không thể hoàn thành đơn kiểm kê",
          severity: "error",
        })
      }
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: "Đã xảy ra lỗi khi hoàn thành đơn kiểm kê", severity: "error" })
    }
  }

  const handleClearInspections = async () => {
    if (!order) return
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      // Corrected URL path
      const response = await axios.patch(
        `${backendUrl}/api/inventory-check-inspections/${order._id}/clear-inspections`,
        {}, // Empty body as per your route definition
        {
          headers: getAuthHeaders(),
        },
      )
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: "Đã xóa toàn bộ số lượng thực tế và đặt lại trạng thái phiếu kiểm con",
          severity: "success",
        })
        fetchOrder() // Refresh order data to get updated status
        fetchInspections() // Refresh inspections data to get cleared quantities and draft status
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Không thể xóa phiếu kiểm con",
          severity: "error",
        })
      }
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: "Đã xảy ra lỗi khi xóa phiếu kiểm con", severity: "error" })
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      // Updated URL to match the new consolidated route structure
      const response = await axios.patch(
        `${backendUrl}/api/inventory-check-inspections/${order._id}/status`,
        {
          status: "cancelled",
        },
        {
          headers: getAuthHeaders(),
        },
      )
      if (response.data.success) {
        setOrder((prev) => ({ ...prev, status: "cancelled" }))
        setSnackbar({ open: true, message: "Đơn kiểm kê đã được hủy thành công", severity: "success" })
        fetchOrder() // Refresh order data
        fetchInspections() // Refresh inspections data
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Không thể hủy đơn kiểm kê",
          severity: "error",
        })
      }
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, message: "Đã xảy ra lỗi khi hủy đơn kiểm kê", severity: "error" })
    }
  }

  if (loadingOrder || loadingInspections) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} variant="contained" onClick={handleRefresh}>
          Thử lại
        </Button>
      </Box>
    )
  }

  if (!order) return null

  const isProcessing = order.status === "processing"
  const isCancelledOrCompleted = order.status === "cancelled" || order.status === "completed"

  return (
    <Box sx={{ background: theme.palette.background.default, minHeight: "100vh", py: 4 }}>
      <Container>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Check Inventory Order Detail
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Order ID: {order._id}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleRefresh}>
            <RefreshIcon fontSize="small" sx={{ mr: 1 }} /> Làm mới
          </Button>
        </Stack>

        {/* Order Detail Section */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Order Detail</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip variant="outlined" label={order.status} color={getStatusColor(order.status)} size="small" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Inventory Date
                </Typography>
                <Typography variant="body1">{formatDate(order.inventory_check_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">{formatDateTime(order.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Warehouse Manager
                </Typography>
                <Typography variant="body1">
                  {order.warehouse_manager_id?.email || order.warehouse_manager_id}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created By
                </Typography>
                <Typography variant="body1">{order.created_by?.email || order.created_by}</Typography>
              </Grid>
              {order.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{order.notes}</Typography>
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Inspections Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Inspections</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {loadingInspections ? (
              <Box sx={{ display: "flex", justifyContent: "center", width: "100%", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : inspections.length > 0 ? (
              <Stack spacing={2}>
                {inspections.map((ins) => {
                  const loc = ins.location_id
                  const locStr = loc
                    ? `${loc.area_id?.name || ""} - ${loc.bay || ""} - ${loc.row || ""} - ${loc.column || ""}`
                    : "N/A"
                  return (
                    <Accordion key={ins._id} sx={{ border: "1px solid #e0e0e0", boxShadow: "none" }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Location:
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {locStr}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Status:
                            </Typography>
                            <Chip label={ins.status} color={getStatusColor(ins.status)} size="small" />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Checked By:
                            </Typography>
                            <Typography variant="body1">{ins.check_by?.email || ins.check_by || "N/A"}</Typography>
                          </Grid>
                        </Grid>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Packages in this Location:
                        </Typography>
                        {ins.check_items && ins.check_items.length > 0 ? (
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Medicine</TableCell>
                                <TableCell>Batch</TableCell>
                                <TableCell>Expected</TableCell>
                                <TableCell>Actual</TableCell>
                                <TableCell>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {ins.check_items.map((item) => {
                                const pkgId = item.package_id?._id
                                const chipLabel = item.type
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (char) => char.toUpperCase()) // Format "over_expected" to "Over Expected"
                                const chip = <Chip label={chipLabel} size="small" color={getStatusColor(item.type)} />
                                return (
                                  <TableRow key={pkgId}>
                                    <TableCell>{pkgId?.slice(-4)}</TableCell>
                                    <TableCell>
                                      {`${item?.package_id?.batch_id?.medicine_id?.medicine_name || "N/A"} - ${item?.package_id?.batch_id?.medicine_id?.license_code || "N/A"}`}
                                    </TableCell>
                                    <TableCell>{item?.package_id?.batch_id?.batch_code || "N/A"}</TableCell>
                                    <TableCell>{item?.expected_quantity || 0}</TableCell>
                                    <TableCell>{item?.actual_quantity || 0}</TableCell>
                                    <TableCell>{chip}</TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            No packages found for this inspection.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                No inspections to display.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4, gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleClearInspections}
            disabled={!isProcessing} // Only enabled if order is processing
          >
            Clear
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelOrder}
            disabled={isCancelledOrCompleted} // Disabled if already cancelled or completed
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCompleteCheck}
            disabled={!isProcessing} // Only enabled if order is processing
          >
            Hoàn thành kiểm kê
          </Button>
        </Box>
      </Container>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((sn) => ({ ...sn, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
