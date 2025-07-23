"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Import useRouter để chuyển hướng nếu cần

// Giả định các hằng số vai trò người dùng
const USER_ROLES = {
  WAREHOUSEMANAGER: "warehouse_manager",
  WAREHOUSE: "warehouse",
  // ... các vai trò khác nếu có
}

export default function AssignTask() {
  const router = useRouter()
  const [exportOrders, setExportOrders] = useState([])
  const [warehouseStaff, setWarehouseStaff] = useState([]) // Kept for potential future use or display
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false) // Kept for potential future use
  const [packingDialogOpen, setPackingDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  // packingDetails will now be an array of objects, each representing a medicine detail
  // and containing its actual_item array
  const [packingDetails, setPackingDetails] = useState([])
  const [activeTab, setActiveTab] = useState("approved")
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null) // New state for current user ID
  const [isRoleLoading, setIsRoleLoading] = useState(true)
  const [defaultPackageId, setDefaultPackageId] = useState(null)

  // Lấy token xác thực từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token") // Lấy token đã lưu
  }

  // Fetch current user role and ID
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      setIsRoleLoading(true)
      const token = getAuthToken()
      if (!token) {
        console.warn("No auth token found. Redirecting to login.")
        router.push("/auth/login") // Chuyển hướng đến trang đăng nhập nếu không có token
        setIsRoleLoading(false)
        return
      }
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
        const res = await fetch(`${backendUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          const errorData = await res.json()
          console.error("Failed to fetch current user role:", errorData.message || res.statusText)
          // Nếu token không hợp lệ hoặc hết hạn, chuyển hướng đến trang đăng nhập
          if (res.status === 401 || res.status === 403) {
            router.push("/auth/login")
          }
          throw new Error(errorData.message || "Failed to fetch current user role")
        }
        const data = await res.json()
        setCurrentUserRole(data.data.role) // Cập nhật vai trò người dùng
        setCurrentUserId(data.data._id) // Cập nhật ID người dùng
      } catch (error) {
        console.error("Error fetching current user role:", error)
        // Xử lý lỗi, có thể hiển thị thông báo hoặc chuyển hướng
      } finally {
        setIsRoleLoading(false)
      }
    }
    fetchCurrentUserRole()
  }, [router]) // Thêm router vào dependency array

  // Fetch warehouse staff from backend (kept for completeness, though not used for assignment in UI)
  const fetchWarehouseStaff = async () => {
    setStaffLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        console.warn("No auth token found for staff fetch.")
        return
      }
      const res = await fetch(`${backendUrl}/api/users?role=warehouse`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch warehouse staff")
      }
      const data = await res.json()
      setWarehouseStaff(data.data)
    } catch (error) {
      console.error("Error fetching warehouse staff:", error)
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

  const fetchPackages = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        console.warn("No auth token found for package fetch.")
        return
      }
      const res = await fetch(`${backendUrl}/api/packages`, {
        // Assuming /api/packages endpoint exists
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch packages")
      }
      const data = await res.json()
      if (data.data && data.data.length > 0) {
        setDefaultPackageId(data.data[0]._id) // Lấy ID của gói hàng đầu tiên làm mặc định
      } else {
        console.warn("No packages found. Cannot set a default package ID.")
      }
    } catch (error) {
      console.error("Error fetching packages:", error)
      // Fallback for development if API not ready: use a known ID from seed script if possible
      // For now, we rely on the API. If this fails, the packing update might still fail.
    }
  }

  // Fetch export orders from backend
  const fetchExportOrders = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        console.warn("No auth token found for order fetch.")
        return
      }
      const res = await fetch(`${backendUrl}/api/export-orders`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch export orders")
      }
      const data = await res.json()
      setExportOrders(data.data)
    } catch (error) {
      console.error("Error fetching export orders:", error)
      const mockData = [
        {
          _id: "1",
          contract_id: {
            _id: "c1",
            contract_code: "HD001",
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
                medicine_name: "Paracetamol 500mg",
                unit_of_measure: "viên",
              },
              expected_quantity: 1000,
              actual_item: [], // Initialize as empty array
              unit_price: 500,
            },
            {
              medicine_id: {
                _id: "m2",
                medicine_name: "Amoxicillin 250mg",
                unit_of_measure: "viên",
              },
              expected_quantity: 500,
              actual_item: [
                {
                  package_id: { _id: "p1", package_code: "PKG001" },
                  quantity: 200,
                  created_by: { _id: "s1", email: "staff1@company.com" },
                },
                {
                  package_id: { _id: "p2", package_code: "PKG002" },
                  quantity: 100,
                  created_by: { _id: "s1", email: "staff1@company.com" },
                },
              ],
              unit_price: 1200,
            },
          ],
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          _id: "2",
          contract_id: {
            _id: "c2",
            contract_code: "HD002",
          },
          status: "approved",
          created_by: {
            _id: "u2",
            email: "sales@company.com",
          },
          warehouse_manager_id: {
            _id: "s1",
            email: "staff1@company.com",
          },
          details: [
            {
              medicine_id: {
                _id: "m3",
                medicine_name: "Vitamin C 1000mg",
                unit_of_measure: "viên",
              },
              expected_quantity: 200,
              actual_item: [
                {
                  package_id: { _id: "p3", package_code: "PKG003" },
                  quantity: 180,
                  created_by: { _id: "s1", email: "staff1@company.com" },
                },
              ],
              unit_price: 800,
            },
          ],
          createdAt: "2024-01-14T14:30:00Z",
        },
        {
          _id: "3",
          contract_id: {
            _id: "c3",
            contract_code: "HD003",
          },
          status: "completed",
          created_by: {
            _id: "u1",
            email: "admin@company.com",
          },
          details: [
            {
              medicine_id: {
                _id: "m1",
                medicine_name: "Paracetamol 500mg",
                unit_of_measure: "viên",
              },
              expected_quantity: 500,
              actual_item: [
                {
                  package_id: { _id: "p4", package_code: "PKG004" },
                  quantity: 500,
                  created_by: { _id: "s2", email: "staff2@company.com" },
                },
              ],
              unit_price: 500,
            },
          ],
          createdAt: "2024-01-13T11:00:00Z",
        },
        {
          _id: "4",
          contract_id: {
            _id: "c4",
            contract_code: "HD004",
          },
          status: "cancelled",
          created_by: {
            _id: "u2",
            email: "sales@company.com",
          },
          details: [
            {
              medicine_id: {
                _id: "m4",
                medicine_name: "Ibuprofen 200mg",
                unit_of_measure: "viên",
              },
              expected_quantity: 300,
              actual_item: [],
              unit_price: 300,
            },
          ],
          createdAt: "2024-01-12T09:00:00Z",
        },
      ]
      setExportOrders(mockData)
    } finally {
      setLoading(false)
    }
  }

  // Chạy fetch data khi component mount và khi role được tải xong
  useEffect(() => {
    if (!isRoleLoading && currentUserRole) {
      fetchExportOrders()
      fetchWarehouseStaff() // Still fetch staff, even if assignment UI is removed
      fetchPackages() // Call fetchPackages here
    }
  }, [isRoleLoading, currentUserRole]) // Chạy lại khi role hoặc trạng thái tải role thay đổi

  const handleOpenPackingDialog = (order) => {
    setSelectedOrder(order)
    // Initialize packingDetails by summing up actual_item quantities for each medicine
    setPackingDetails(
      order.details.map((detail) => ({
        ...detail,
        // Calculate total actual_quantity from actual_item array for display
        actual_quantity: detail.actual_item ? detail.actual_item.reduce((sum, item) => sum + item.quantity, 0) : 0,
      })),
    )
    setPackingDialogOpen(true)
  }

  const handleClosePackingDialog = () => {
    setPackingDialogOpen(false)
    setSelectedOrder(null)
    setPackingDetails([])
  }

  // Function to handle quantity change for the single actual_quantity input
  const handleQuantityChange = (index, value) => {
    const quantity = Number.parseInt(value) || 0
    setPackingDetails((prev) =>
      prev.map((detail, i) => (i === index ? { ...detail, actual_quantity: quantity } : detail)),
    )
  }

  const handleUpdatePacking = async (e) => {
    e.preventDefault()
    if (!selectedOrder) return

    // Calculate total actual quantity for each detail to check against expected
    const allQuantitiesMatch = packingDetails.every((detail) => {
      return detail.actual_quantity >= detail.expected_quantity // Allow over-packing or exact
    })

    if (currentUserRole === USER_ROLES.WAREHOUSE && !allQuantitiesMatch) {
      const confirmContinue = window.confirm(
        "Một số mặt hàng chưa đạt số lượng yêu cầu. Bạn có muốn tiếp tục cập nhật không?",
      )
      if (!confirmContinue) {
        return
      }
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        alert("Không có token xác thực. Vui lòng đăng nhập lại.")
        return
      }

      // Prepare data to send: transform single actual_quantity into actual_item array
      const payloadDetails = packingDetails.map((detail, index) => {
        const originalDetail = selectedOrder.details[index]
        const existingActualItem =
          originalDetail.actual_item && originalDetail.actual_item.length > 0
            ? originalDetail.actual_item[0] // Lấy mục đầu tiên nếu có nhiều, vì UI chỉ cho phép một số lượng tổng
            : null

        let newActualItemArray = []

        if (detail.actual_quantity > 0) {
          // Nếu có actual_item hiện có, sử dụng lại package_id và created_by của nó
          if (existingActualItem) {
            newActualItemArray = [
              {
                package_id: existingActualItem.package_id?._id || existingActualItem.package_id, // Xử lý trường hợp đã populate hoặc chưa
                quantity: detail.actual_quantity,
                created_by: existingActualItem.created_by?._id || existingActualItem.created_by, // Xử lý trường hợp đã populate hoặc chưa
              },
            ]
          } else {
            // Nếu không có actual_item hiện có, chúng ta vẫn cần package_id và created_by cho mục mới
            if (!defaultPackageId) {
              // Điều này nên được ngăn chặn bởi UI hoặc xử lý bằng một lỗi rõ ràng hơn
              throw new Error("Không tìm thấy ID gói hàng mặc định. Vui lòng thêm gói hàng trước.")
            }
            newActualItemArray = [
              {
                package_id: defaultPackageId, // Sử dụng ID gói hàng mặc định đã fetch
                quantity: detail.actual_quantity,
                created_by: currentUserId, // Sử dụng ID của người dùng hiện tại
              },
            ]
          }
        }
        // Nếu actual_quantity là 0, newActualItemArray vẫn là mảng rỗng, điều này là đúng.

        return {
          medicine_id: detail.medicine_id._id,
          expected_quantity: detail.expected_quantity,
          unit_price: detail.unit_price,
          actual_item: newActualItemArray,
        }
      })

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
      setExportOrders((prev) => prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order)))
      handleClosePackingDialog()
    } catch (error) {
      console.error("Error updating packing:", error)
      alert(`Cập nhật đóng gói thất bại: ${error.message || ""}`)
    }
  }

  const handleCompleteOrder = async (orderId) => {
    const order = exportOrders.find((o) => o._id === orderId)
    if (!order) return
    const confirmAction = window.confirm("Bạn có chắc chắn muốn hoàn thành đơn hàng này không?")
    if (!confirmAction) return
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        alert("Không có token xác thực. Vui lòng đăng nhập lại.")
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
        throw new Error(errorData.error || "API call failed")
      }
      const updatedOrder = await res.json()
      setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
      alert("Đơn hàng đã hoàn thành!")
    } catch (error) {
      console.error(`Error completing order:`, error)
      alert(`Hoàn thành đơn hàng thất bại: ${error.message || ""}`)
    }
  }

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")
    if (!confirmCancel) return
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) {
        alert("Không có token xác thực. Vui lòng đăng nhập lại.")
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
      setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
      alert("Đơn hàng đã được hủy!")
    } catch (error) {
      console.error("Error cancelling order:", error)
      alert(`Hủy đơn hàng thất bại: ${error.message || ""}`)
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

  // Hiển thị loading nếu đang tải vai trò hoặc dữ liệu
  if (loading || isRoleLoading || !currentUserRole) {
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
        <p style={{ fontSize: "12px", color: "#999" }}>Vai trò hiện tại: {currentUserRole}</p>
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
                    {/* Giữ cột "Nhân viên phụ trách" để warehouse_manager vẫn có thể xem */}
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Nhân viên phụ trách</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Trạng thái</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Ngày tạo</th>
                    <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedOrders.map((order, idx) => {
                    return (
                      <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px" }}>{idx + 1}</td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {order.contract_id?.contract_code || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                        {/* Giữ cột "Nhân viên phụ trách" để warehouse_manager vẫn có thể xem */}
                        <td style={{ padding: "12px" }}>
                          {order.warehouse_manager_id ? order.warehouse_manager_id.email : "Chưa phân công"}
                        </td>
                        <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                        <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", gap: "8px" }}>
                            {(currentUserRole === USER_ROLES.WAREHOUSE ||
                              currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
                              <button
                                onClick={() => handleOpenPackingDialog(order)}
                                disabled={!order.warehouse_manager_id && currentUserRole === USER_ROLES.WAREHOUSE} // Warehouse needs to be assigned to pack
                                style={{
                                  padding: "6px 12px",
                                  border: "1px solid #d1d5db",
                                  backgroundColor:
                                    order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER
                                      ? "white"
                                      : "#f3f4f6",
                                  borderRadius: "4px",
                                  cursor:
                                    order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER
                                      ? "pointer"
                                      : "not-allowed",
                                  fontSize: "12px",
                                  color:
                                    order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER
                                      ? "black"
                                      : "#9ca3af",
                                }}
                              >
                                Đóng gói
                              </button>
                            )}
                            {currentUserRole === USER_ROLES.WAREHOUSEMANAGER && ( // Chỉ hiển thị cho warehouse_manager
                              <>
                                <button
                                  onClick={() => handleCompleteOrder(order._id)}
                                  style={{
                                    padding: "6px 12px",
                                    border: "none",
                                    backgroundColor: "#3b82f6",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                  }}
                                >
                                  Hoàn thành
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order._id)}
                                  style={{
                                    padding: "6px 12px",
                                    border: "none",
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                  }}
                                >
                                  Hủy
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
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
                  {completedOrders.map((order, idx) => {
                    return (
                      <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px" }}>{idx + 1}</td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {order.contract_id?.contract_code || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                        <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                        <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      </tr>
                    )
                  })}
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
                  {cancelledOrders.map((order, idx) => {
                    return (
                      <tr key={order._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "12px" }}>{idx + 1}</td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>
                          {order.contract_id?.contract_code || "N/A"}
                        </td>
                        <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                        <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                        <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Packing Dialog */}
      {packingDialogOpen &&
        (currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
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
                Nhập số lượng thực tế đã đóng gói cho đơn hàng {selectedOrder?.contract_id?.contract_code || "N/A"}
              </p>
              <form onSubmit={handleUpdatePacking}>
                <div style={{ marginBottom: "20px", maxHeight: "400px", overflow: "auto" }}>
                  {packingDetails.map((detail, index) => (
                    <div
                      key={detail.medicine_id?._id || index}
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
                        <div style={{ fontWeight: "500", marginBottom: "4px" }}>
                          {detail.medicine_id?.medicine_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          Yêu cầu: {detail.expected_quantity} {detail.medicine_id?.unit_of_measure}
                        </div>
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
                          // Chỉ hiển thị viền đỏ nếu người dùng là warehouse và số lượng thiếu
                          style={{
                            width: "100%",
                            padding: "6px 8px",
                            border: `1px solid ${
                              currentUserRole === USER_ROLES.WAREHOUSE &&
                              detail.actual_quantity < detail.expected_quantity
                                ? "#ef4444"
                                : "#d1d5db"
                            }`,
                            borderRadius: "4px",
                            fontSize: "14px",
                          }}
                          disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER} // warehousemanager không thể chỉnh sửa số lượng
                        />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", fontWeight: "500" }}>{detail.medicine_id?.unit_of_measure}</div>
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
                  {(currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
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
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}
