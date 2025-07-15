"use client"

import { useEffect, useState } from "react"

export default function AssignTask() {
  const [exportOrders, setExportOrders] = useState([])
  const [warehouseStaff, setWarehouseStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [packingDialogOpen, setPackingDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [packingDetails, setPackingDetails] = useState([])
  const [activeTab, setActiveTab] = useState("approved")

  // Lấy token xác thực từ đâu đó (ví dụ: localStorage, context, Redux store)
  // Bạn cần thay thế logic này bằng cách lấy token thực tế của mình
  const getAuthToken = () => {
    // Ví dụ: return localStorage.getItem('authToken');
    return "YOUR_AUTH_TOKEN_HERE" // THAY THẾ BẰNG TOKEN XÁC THỰC THỰC TẾ CỦA BẠN
  }

  // Fetch warehouse staff from backend
  const fetchWarehouseStaff = async () => {
    setStaffLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}/api/users?role=warehouse`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch warehouse staff")
      }
      const data = await res.json()
      setWarehouseStaff(data.data) // API trả về { success: true, data: [...] }
    } catch (error) {
      console.error("Error fetching warehouse staff:", error)
      alert(`Không thể tải danh sách nhân viên kho: ${error.message}. Vui lòng thử lại.`)
      // Fallback to mock data for development if API fails
      const mockStaff = [
        { _id: "s1", email: "staff1@company.com", role: "warehouse" },
        { _id: "s2", email: "staff2@company.com", role: "warehouse" },
        { _id: "s3", email: "staff3@company.com", role: "warehouse" },
      ]
      setWarehouseStaff(mockStaff)
    } finally {
      setStaffLoading(false)
    }
  }

  // Fetch export orders from backend
  const fetchExportOrders = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}/api/export-orders`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch export orders")
      }
      const data = await res.json()
      setExportOrders(data.data) // API trả về { success: true, data: [...] }
    } catch (error) {
      console.error("Error fetching export orders:", error)
      alert(`Không thể tải danh sách đơn hàng xuất kho: ${error.message}. Vui lòng thử lại.`)
      // Fallback to mock data for development if API fails
      const mockData = [
        {
          _id: "1",
          contract_id: {
            _id: "c1",
            contract_number: "HD001",
          },
          status: "approved",
          created_by: {
            _id: "u1",
            email: "admin@company.com",
          },
          details: [
            {
              medicine_id: {
                _id: "m1",
                medicine_name: "Paracetamol 500mg", // Đã sửa: dùng medicine_name
                unit_of_measure: "viên",
              },
              expected_quantity: 1000,
              actual_quantity: 0,
              unit_price: 500,
            },
            {
              medicine_id: {
                _id: "m2",
                medicine_name: "Amoxicillin 250mg", // Đã sửa: dùng medicine_name
                unit_of_measure: "viên",
              },
              expected_quantity: 500,
              actual_quantity: 0,
              unit_price: 1200,
            },
          ],
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          _id: "2",
          contract_id: {
            _id: "c2",
            contract_number: "HD002",
          },
          status: "approved",
          created_by: {
            _id: "u2",
            email: "sales@company.com",
          },
          assigned_staff: {
            _id: "s1",
            email: "staff1@company.com",
          },
          details: [
            {
              medicine_id: {
                _id: "m3",
                medicine_name: "Vitamin C 1000mg", // Đã sửa: dùng medicine_name
                unit_of_measure: "viên",
              },
              expected_quantity: 200,
              actual_quantity: 180,
              unit_price: 800,
            },
          ],
          createdAt: "2024-01-14T14:30:00Z",
        },
      ]
      setExportOrders(mockData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExportOrders()
    fetchWarehouseStaff()
  }, [])

  const handleOpenAssignDialog = (order) => {
    setSelectedOrder(order)
    setSelectedStaffId(order.warehouse_manager_id?._id || "") // Use warehouse_manager_id for assigned staff
    setAssignDialogOpen(true)
  }

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false)
    setSelectedOrder(null)
    setSelectedStaffId("")
  }

  const handleOpenPackingDialog = (order) => {
    setSelectedOrder(order)
    setPackingDetails([...order.details])
    setPackingDialogOpen(true)
  }

  const handleClosePackingDialog = () => {
    setPackingDialogOpen(false)
    setSelectedOrder(null)
    setPackingDetails([])
  }

  const handleQuantityChange = (index, value) => {
    const quantity = Number.parseInt(value) || 0
    setPackingDetails((prev) =>
      prev.map((detail, i) => (i === index ? { ...detail, actual_quantity: quantity } : detail)),
    )
  }

  // Assign staff to order
  const handleAssignStaff = async (e) => {
    e.preventDefault()
    if (!selectedOrder || !selectedStaffId) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}/api/export-orders/${selectedOrder._id}/assign-staff`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ staffId: selectedStaffId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to assign staff")
      }

      const updatedOrder = await res.json()
      // Update local state with the data returned from the API
      setExportOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)))

      handleCloseAssignDialog()
      alert("Phân công nhân viên thành công!")
    } catch (error) {
      console.error("Error assigning staff:", error)
      alert(`Phân công nhân viên thất bại: ${error.message || "Vui lòng thử lại."}`)
    }
  }

  // Update packing details
  const handleUpdatePacking = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}/api/export-orders/${selectedOrder._id}/update-packing`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ details: packingDetails }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to update packing")
      }

      const updatedOrder = await res.json()
      // Update local state with the data returned from the API
      setExportOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)))

      handleClosePackingDialog()
      alert("Cập nhật đóng gói thành công!")
    } catch (error) {
      console.error("Error updating packing:", error)
      alert(`Cập nhật đóng gói thất bại: ${error.message || "Vui lòng thử lại."}`)
    }
  }

  // Complete or cancel order
  const handleCompleteOrder = async (orderId) => {
    const order = exportOrders.find((o) => o._id === orderId)
    if (!order) return

    const hasInsufficientQuantity = order.details.some((detail) => detail.actual_quantity < detail.expected_quantity)

    let endpoint = ""
    let successMessage = ""
    let errorMessage = ""

    if (hasInsufficientQuantity) {
      const confirmCancel = window.confirm("Một số sản phẩm không đủ số lượng. Bạn có muốn hủy đơn hàng này không?")
      if (!confirmCancel) return // User chose not to cancel
      endpoint = `/api/export-orders/${orderId}/cancel`
      successMessage = "Đơn hàng đã được hủy!"
      errorMessage = "Hủy đơn hàng thất bại. Vui lòng thử lại."
    } else {
      endpoint = `/api/export-orders/${orderId}/complete`
      successMessage = "Đơn hàng đã hoàn thành!"
      errorMessage = "Hoàn thành đơn hàng thất bại. Vui lòng thử lại."
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "API call failed")
      }

      const updatedOrder = await res.json()
      setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
      alert(successMessage)
    } catch (error) {
      console.error(`Error ${endpoint.includes("cancel") ? "cancelling" : "completing"} order:`, error)
      alert(`${errorMessage} ${error.message || ""}`)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: "Đã duyệt", className: "bg-blue-100 text-blue-800" },
      completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status] || statusConfig.approved
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>
  }

  const approvedOrders = exportOrders.filter((order) => order.status === "approved")
  const completedOrders = exportOrders.filter((order) => order.status === "completed")
  const cancelledOrders = exportOrders.filter((order) => order.status === "cancelled")

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div>Đang tải...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      {/* Header */}
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "24px",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" }}>Quản lý Kho Dược phẩm</h1>
        <p style={{ color: "#666", margin: 0 }}>Phân công nhân viên và quản lý đóng gói đơn hàng xuất kho</p>
      </div>

      {/* Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Chờ xử lý</h3>
            <span>📦</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{approvedOrders.length}</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Đã phân công</h3>
            <span>👥</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {approvedOrders.filter((order) => order.warehouse_manager_id).length}
          </div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Hoàn thành</h3>
            <span>✅</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{completedOrders.length}</div>
        </div>

        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Đã hủy</h3>
            <span>❌</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{cancelledOrders.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
          <button
            onClick={() => setActiveTab("approved")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: activeTab === "approved" ? "#f3f4f6" : "transparent",
              borderBottom: activeTab === "approved" ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "approved" ? "600" : "400",
            }}
          >
            Chờ xử lý ({approvedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: activeTab === "completed" ? "#f3f4f6" : "transparent",
              borderBottom: activeTab === "completed" ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "completed" ? "600" : "400",
            }}
          >
            Hoàn thành ({completedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            style={{
              padding: "12px 24px",
              border: "none",
              backgroundColor: activeTab === "cancelled" ? "#f3f4f6" : "transparent",
              borderBottom: activeTab === "cancelled" ? "2px solid #3b82f6" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "cancelled" ? "600" : "400",
            }}
          >
            Đã hủy ({cancelledOrders.length})
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {activeTab === "approved" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>STT</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Số hợp đồng</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Người tạo</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Nhân viên phụ trách</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Ngày tạo</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedOrders.map((order, idx) => (
                    <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px" }}>{idx + 1}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id.contract_number}</td>
                      <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                      <td style={{ padding: "12px" }}>
                        {order.warehouse_manager_id ? order.warehouse_manager_id.email : "Chưa phân công"}
                      </td>
                      <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleOpenAssignDialog(order)}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid #d1d5db",
                              backgroundColor: "white",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}
                          >
                            {order.warehouse_manager_id ? "Thay đổi" : "Phân công"}
                          </button>
                          <button
                            onClick={() => handleOpenPackingDialog(order)}
                            disabled={!order.warehouse_manager_id}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid #d1d5db",
                              backgroundColor: order.warehouse_manager_id ? "white" : "#f3f4f6",
                              borderRadius: "4px",
                              cursor: order.warehouse_manager_id ? "pointer" : "not-allowed",
                              fontSize: "12px",
                              color: order.warehouse_manager_id ? "black" : "#9ca3af",
                            }}
                          >
                            Đóng gói
                          </button>
                          <button
                            onClick={() => handleCompleteOrder(order._id)}
                            disabled={!order.warehouse_manager_id}
                            style={{
                              padding: "6px 12px",
                              border: "none",
                              backgroundColor: order.warehouse_manager_id ? "#3b82f6" : "#9ca3af",
                              color: "white",
                              borderRadius: "4px",
                              cursor: order.warehouse_manager_id ? "pointer" : "not-allowed",
                              fontSize: "12px",
                            }}
                          >
                            Hoàn thành
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "completed" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>STT</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Số hợp đồng</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Người tạo</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {completedOrders.map((order, idx) => (
                    <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px" }}>{idx + 1}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id.contract_number}</td>
                      <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                      <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "cancelled" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>STT</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Số hợp đồng</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Người tạo</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledOrders.map((order, idx) => (
                    <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "12px" }}>{idx + 1}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id.contract_number}</td>
                      <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                      <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Staff Dialog */}
      {assignDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>Phân công nhân viên</h2>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
              Chọn nhân viên kho để phụ trách đơn hàng {selectedOrder?.contract_id.contract_number}
            </p>

            <form onSubmit={handleAssignStaff}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>Nhân viên</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                >
                  <option value="">Chọn nhân viên...</option>
                  {warehouseStaff.map((staff) => (
                    <option key={staff._id} value={staff._id}>
                      {staff.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleCloseAssignDialog}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={staffLoading || !selectedStaffId}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    backgroundColor: !staffLoading && selectedStaffId ? "#3b82f6" : "#9ca3af",
                    color: "white",
                    borderRadius: "4px",
                    cursor: !staffLoading && selectedStaffId ? "pointer" : "not-allowed",
                  }}
                >
                  Phân công
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Packing Dialog */}
      {packingDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>Cập nhật số lượng đóng gói</h2>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
              Nhập số lượng thực tế đã đóng gói cho đơn hàng {selectedOrder?.contract_id.contract_number}
            </p>

            <form onSubmit={handleUpdatePacking}>
              <div style={{ marginBottom: "20px", maxHeight: "400px", overflow: "auto" }}>
                {packingDetails.map((detail, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 150px 80px",
                      gap: "16px",
                      alignItems: "center",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "500", marginBottom: "4px" }}>{detail.medicine_id?.medicine_name}</div>{" "}
                      {/* Đã thêm ?. */}
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Yêu cầu: {detail.expected_quantity} {detail.medicine_id?.unit_of_measure}
                      </div>{" "}
                      {/* Đã thêm ?. */}
                    </div>

                    <div>
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "12px" }}>
                        Số lượng thực tế
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={detail.actual_quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: `1px solid ${detail.actual_quantity < detail.expected_quantity ? "#ef4444" : "#d1d5db"}`,
                          borderRadius: "4px",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "12px", fontWeight: "500" }}>{detail.medicine_id?.unit_of_measure}</div>{" "}
                      {/* Đã thêm ?. */}
                      {detail.actual_quantity < detail.expected_quantity && (
                        <div style={{ fontSize: "10px", color: "#ef4444" }}>
                          Thiếu {detail.expected_quantity - detail.actual_quantity}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleClosePackingDialog}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    backgroundColor: "white",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
