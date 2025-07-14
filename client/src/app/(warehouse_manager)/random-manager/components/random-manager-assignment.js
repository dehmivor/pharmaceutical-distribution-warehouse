"use client"
import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from "@mui/material"
import PersonIcon from "@mui/icons-material/Person"
import AssignmentIcon from "@mui/icons-material/Assignment"
import GroupIcon from "@mui/icons-material/Group"
import ShuffleIcon from "@mui/icons-material/Shuffle"

export default function RandomManagerAssignment() {
  const [managers, setManagers] = useState([])
  const [staff, setStaff] = useState([])
  const [batches, setBatches] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedManager, setSelectedManager] = useState(null)
  const [assignmentDialog, setAssignmentDialog] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    batch_id: "",
    staff_assignments: [],
    task_type: "packing",
    priority: "medium",
    due_date: "",
    estimated_hours: 4,
    notes: "",
  })

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      const [managersRes, staffRes, batchesRes, assignmentsRes] = await Promise.all([
        fetch("http://localhost:5000/api/users?role=warehouse_manager&status=active"),
        fetch("http://localhost:5000/api/users?role=warehouse&status=active"),
        fetch("http://localhost:5000/api/batches"),
        fetch("http://localhost:5000/api/assignments"),
      ])

      const managersData = await managersRes.json()
      const staffData = await staffRes.json()
      const batchesData = await batchesRes.json()
      const assignmentsData = await assignmentsRes.json()

      setManagers(managersData.users || managersData)
      setStaff(staffData.users || staffData)
      setBatches(Array.isArray(batchesData) ? batchesData : batchesData.batches || [])
      setAssignments(assignmentsData.assignments || assignmentsData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Random select manager
  const handleRandomManager = () => {
    if (managers.length === 0) {
      alert("Không có warehouse manager khả dụng")
      return
    }

    const activeManagers = managers.filter((m) => m.status === "active")
    if (activeManagers.length === 0) {
      alert("Không có warehouse manager đang hoạt động")
      return
    }

    const randomIndex = Math.floor(Math.random() * activeManagers.length)
    const randomManager = activeManagers[randomIndex]
    setSelectedManager(randomManager)

    // Show success message
    alert(`🎯 Đã chọn Manager: ${randomManager.email}`)
  }

  // Auto assign staff to batches
  const handleAutoAssignStaff = async () => {
    if (!selectedManager) {
      alert("Vui lòng chọn Manager trước")
      return
    }

    if (staff.length === 0) {
      alert("Không có nhân viên khả dụng")
      return
    }

    // Get unassigned batches
    const assignedBatchIds = assignments.map((a) => a.batch_id?._id || a.batch_id)
    const unassignedBatches = Array.isArray(batches) ? batches.filter((b) => !assignedBatchIds.includes(b._id)) : []

    if (unassignedBatches.length === 0) {
      alert("Tất cả lô hàng đã được phân công")
      return
    }

    // Filter staff - prioritize packers
    const warehouseStaff = staff.filter((s) => s.role === "warehouse")
    const availableStaff = warehouseStaff

    if (availableStaff.length === 0) {
      alert("Không có nhân viên đóng gói khả dụng")
      return
    }

    try {
      // Auto assign up to 5 batches
      const batchesToAssign = unassignedBatches.slice(0, 5).map((b) => b._id)

      const res = await fetch("http://localhost:5000/api/assignments/auto-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_ids: batchesToAssign,
          task_type: "packing",
          priority: "medium",
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          estimated_hours: 4,
          assigned_by: selectedManager._id,
        }),
      })

      if (!res.ok) throw new Error("Failed to auto assign")

      const result = await res.json()
      alert(`✅ ${result.message}`)
      await fetchData() // Refresh data
    } catch (error) {
      console.error("Error executing auto assignments:", error)
      alert("❌ Phân công tự động thất bại!")
    }
  }

  // Manual assignment
  const handleManualAssignment = () => {
    if (!selectedManager) {
      alert("Vui lòng chọn Manager trước")
      return
    }
    setAssignmentDialog(true)
  }

  const executeManualAssignment = async () => {
    if (!assignmentForm.batch_id || assignmentForm.staff_assignments.length === 0) {
      alert("Vui lòng chọn lô hàng và nhân viên")
      return
    }

    try {
      const assignmentPromises = assignmentForm.staff_assignments.map((staffId) =>
        fetch("http://localhost:5000/api/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batch_id: assignmentForm.batch_id,
            assigned_by: selectedManager._id,
            assigned_to: staffId,
            task_type: assignmentForm.task_type,
            priority: assignmentForm.priority,
            due_date: assignmentForm.due_date,
            estimated_hours: assignmentForm.estimated_hours,
            notes: assignmentForm.notes,
          }),
        }),
      )

      await Promise.all(assignmentPromises)

      alert(`✅ Đã phân công thành công cho ${assignmentForm.staff_assignments.length} nhân viên!`)
      setAssignmentDialog(false)
      setAssignmentForm({
        batch_id: "",
        staff_assignments: [],
        task_type: "packing",
        priority: "medium",
        due_date: "",
        estimated_hours: 4,
        notes: "",
      })
      await fetchData()
    } catch (error) {
      console.error("Error executing manual assignment:", error)
      alert("❌ Phân công thủ công thất bại!")
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  // Get today's assignments by selected manager
  const todayAssignments = selectedManager
    ? assignments.filter((a) => {
        const today = new Date().toDateString()
        const assignedDate = new Date(a.assigned_date).toDateString()
        return assignedDate === today && a.assigned_by?._id === selectedManager._id
      })
    : []

  // Get unassigned batches
  const assignedBatchIds = assignments.map((a) => a.batch_id?._id || a.batch_id)
  const unassignedBatches = Array.isArray(batches) ? batches.filter((b) => !assignedBatchIds.includes(b._id)) : []

  return (
    <Box maxWidth={1400} mx="auto" mt={4}>
      <Typography variant="h4" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <ShuffleIcon color="primary" />
        Random Warehouse Manager & Phân công đóng gói
      </Typography>

      {/* Manager Selection Section */}
      <Paper sx={{ p: 3, mb: 3, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white" }}>
        <Typography variant="h6" gutterBottom>
          🎲 Chọn Warehouse Manager ngẫu nhiên
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleRandomManager}
                startIcon={<ShuffleIcon />}
                size="large"
                sx={{ bgcolor: "rgba(255,255,250,0.2)", "&:hover": { bgcolor: "rgba(255,255,250,0.3)" } }}
              >
                Random Manager
              </Button>
              <Typography variant="body2">Có {managers.length} manager khả dụng</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            {selectedManager && (
              <Card sx={{ bgcolor: "rgba(255,255,250,0.1)", backdropFilter: "blur(10px)" }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: "white", fontWeight: "bold" }}>
                        {selectedManager.email}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,250,0.8)" }}>
                        Role: {selectedManager.role} | Status: {selectedManager.status}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Assignment Actions */}
      {selectedManager && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentIcon color="primary" />
            Phân công nhân viên đóng gói hàng
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    📦 Lô hàng chưa phân công
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    {unassignedBatches.length}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAutoAssignStaff}
                    startIcon={<AssignmentIcon />}
                    disabled={unassignedBatches.length === 0}
                    color="warning"
                  >
                    Tự động phân công
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    👥 Nhân viên khả dụng
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    {staff.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Packer: {staff.filter((s) => s.role === "packer").length} | Staff:{" "}
                    {staff.filter((s) => s.role === "warehouse_staff").length}
                  </Typography>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleManualAssignment}
                    startIcon={<GroupIcon />}
                    color="success"
                  >
                    Phân công thủ công
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    📊 Phân công hôm nay
                  </Typography>
                  <Typography variant="h4" sx={{ my: 1 }}>
                    {todayAssignments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Bởi manager: {selectedManager.email.split("@")[0]}
                  </Typography>
                  <Chip
                    label={todayAssignments.length > 0 ? "Đã có phân công" : "Chưa phân công"}
                    color={todayAssignments.length > 0 ? "success" : "default"}
                    sx={{ width: "100%" }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Staff and Assignments */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <GroupIcon color="primary" />
              Danh sách nhân viên ({staff.length})
            </Typography>
            <List>
              {staff.slice(0, 8).map((worker, index) => (
                <div key={worker._id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: worker.role === "packer" ? "success.main" : "info.main" }}>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={worker.email}
                      secondary={
                        <Box>
                          <Chip
                            label={worker.role}
                            size="small"
                            color={worker.role === "packer" ? "success" : "info"}
                            sx={{ mr: 1 }}
                          />
                          <Chip label={worker.status} size="small" color="default" />
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < staff.slice(0, 8).length - 1 && <Divider />}
                </div>
              ))}
              {staff.length > 8 && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary" align="center">
                        ... và {staff.length - 8} nhân viên khác
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 Phân công gần đây
            </Typography>
            {todayAssignments.length === 0 ? (
              <Alert severity="info">Chưa có phân công nào hôm nay</Alert>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Lô hàng</TableCell>
                    <TableCell>Nhân viên</TableCell>
                    <TableCell>Trạng thái</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAssignments.slice(0, 5).map((assignment) => (
                    <TableRow key={assignment._id}>
                      <TableCell>{assignment.batch_id?.batch_code || "N/A"}</TableCell>
                      <TableCell>{assignment.assigned_to?.email?.split("@")[0] || "N/A"}</TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status}
                          size="small"
                          color={
                            assignment.status === "completed"
                              ? "success"
                              : assignment.status === "in_progress"
                                ? "info"
                                : "warning"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Manual Assignment Dialog */}
      <Dialog open={assignmentDialog} onClose={() => setAssignmentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>🎯 Phân công thủ công - Manager: {selectedManager?.email?.split("@")[0]}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn lô hàng</InputLabel>
                <Select
                  value={assignmentForm.batch_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, batch_id: e.target.value })}
                >
                  {Array.isArray(unassignedBatches)
                    ? unassignedBatches.map((batch) => (
                        <MenuItem key={batch._id} value={batch._id}>
                          {batch.batch_code} - {batch.medicine_id?.medicine_name || "N/A"}
                        </MenuItem>
                      ))
                    : null}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Chọn nhân viên</InputLabel>
                <Select
                  multiple
                  value={assignmentForm.staff_assignments}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, staff_assignments: e.target.value })}
                  renderValue={(selected) =>
                    selected.map((id) => staff.find((s) => s._id === id)?.email?.split("@")[0]).join(", ")
                  }
                >
                  {staff.map((worker) => (
                    <MenuItem key={worker._id} value={worker._id}>
                      {worker.email} ({worker.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Loại công việc</InputLabel>
                <Select
                  value={assignmentForm.task_type}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, task_type: e.target.value })}
                >
                  <MenuItem value="packing">📦 Đóng gói</MenuItem>
                  <MenuItem value="quality_check">🔍 Kiểm tra chất lượng</MenuItem>
                  <MenuItem value="inventory_count">📊 Kiểm kê</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Ưu tiên</InputLabel>
                <Select
                  value={assignmentForm.priority}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, priority: e.target.value })}
                >
                  <MenuItem value="low">🟢 Thấp</MenuItem>
                  <MenuItem value="medium">🟡 Trung bình</MenuItem>
                  <MenuItem value="high">🟠 Cao</MenuItem>
                  <MenuItem value="urgent">🔴 Khẩn cấp</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Hạn hoàn thành"
                type="datetime-local"
                value={assignmentForm.due_date}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Thời gian ước tính (giờ)"
                type="number"
                value={assignmentForm.estimated_hours}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, estimated_hours: Number(e.target.value) })}
                fullWidth
                inputProps={{ min: 0.5, max: 24, step: 0.5 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Ghi chú"
                multiline
                rows={3}
                value={assignmentForm.notes}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                fullWidth
                placeholder="Ghi chú về công việc cần thực hiện..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialog(false)}>Hủy</Button>
          <Button onClick={executeManualAssignment} variant="contained" startIcon={<AssignmentIcon />}>
            Phân công ngay
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
