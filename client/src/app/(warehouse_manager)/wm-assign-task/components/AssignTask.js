"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

// Giả định các hằng số vai trò người dùng
const USER_ROLES = {
  WAREHOUSEMANAGER: "warehouse_manager",
  WAREHOUSE: "warehouse",
}

export default function AssignTask() {
  const router = useRouter()
  const [exportOrders, setExportOrders] = useState([])
  const [warehouseStaff, setWarehouseStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [staffLoading, setStaffLoading] = useState(false)
  const [packingDialogOpen, setPackingDialogOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [packingDetails, setPackingDetails] = useState([])
  const [availablePackages, setAvailablePackages] = useState({})
  const [showingPackageListFor, setShowingPackageListFor] = useState(null)
  const [activeTab, setActiveTab] = useState("approved")
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isRoleLoading, setIsRoleLoading] = useState(true)

  // Lấy token xác thực từ localStorage
  const getAuthToken = () => {
    return localStorage.getItem("auth-token")
  }

  // Fetch current user role and ID
  useEffect(() => {
    const fetchCurrentUserRole = async () => {
      setIsRoleLoading(true)
      const token = getAuthToken()
      if (!token) {
        console.warn("No auth token found. Redirecting to login.")
        router.push("/auth/login")
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
          if (res.status === 401 || res.status === 403) {
            router.push("/auth/login")
          }
          throw new Error(errorData.message || "Failed to fetch current user role")
        }
        const data = await res.json()
        setCurrentUserRole(data.data.role)
        setCurrentUserId(data.data.userId)
      } catch (error) {
        console.error("Error fetching current user role:", error)
      } finally {
        setIsRoleLoading(false)
      }
    }
    fetchCurrentUserRole()
  }, [router])

  // Fetch warehouse staff
  const fetchWarehouseStaff = async () => {
    setStaffLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) return
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
      setWarehouseStaff([
        { _id: "s1", email: "staff1@company.com", role: "warehouse" },
        { _id: "s2", email: "staff2@company.com", role: "warehouse" },
        { _id: "s3", email: "staff3@company.com", role: "warehouse" },
      ])
    } finally {
      setStaffLoading(false)
    }
  }

  // Fetch export orders
  const fetchExportOrders = async () => {
    setLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
      const token = getAuthToken()
      if (!token) return
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
                { package_id: { _id: "p1", package_code: "PKG001" }, quantity: 200, created_by: { _id: "s1" } },
                { package_id: { _id: "p2", package_code: "PKG002" }, quantity: 100, created_by: { _id: "s1" } },
              ],
              unit_price: 1200,
            },
          ],
          createdAt: "2024-01-15T10:00:00Z",
        },
        {
          _id: "2",
          contract_id: { _id: "c2", contract_code: "HD002" },
          status: "approved",
          created_by: { _id: "u2", email: "sales@company.com" },
          warehouse_manager_id: { _id: "s1", email: "staff1@company.com" },
          details: [
            {
              medicine_id: { _id: "m3", medicine_name: "Vitamin C 1000mg", unit_of_measure: "viên" },
              expected_quantity: 200,
              actual_item: [{ package_id: { _id: "p3", package_code: "PKG003" }, quantity: 180, created_by: { _id: "s1" } }],
              unit_price: 800,
            },
          ],
          createdAt: "2024-01-14T14:30:00Z",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Fetch available packages for a medicine
  const fetchAvailablePackages = async (medicineId) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    const token = getAuthToken()
    if (!token) throw new Error("No auth token found")
    const res = await fetch(`${backendUrl}/api/packages/${medicineId}/packages`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
        .map((pkg) => ({ ...pkg, batch: batchGroup.batch }))
    )
    return packages
  }

  useEffect(() => {
    if (!isRoleLoading && currentUserRole) {
      fetchExportOrders()
      fetchWarehouseStaff()
    }
  }, [isRoleLoading, currentUserRole])

  useEffect(() => {
    if (selectedOrder) {
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
          console.error("Error fetching available packages:", error)
        }
      }
      fetchPackages()
    }
  }, [selectedOrder])

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
      }))
    )
    setPackingDialogOpen(true)
  }

  const handleClosePackingDialog = () => {
    setPackingDialogOpen(false)
    setSelectedOrder(null)
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
                sp.package_id === packageId ? { ...sp, quantity } : sp
              ),
            }
          : detail
      )
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
          : detail
      )
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
          : detail
      )
    )
  }

  const handleUpdatePacking = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    // Validate packingDetails
    for (const detail of packingDetails) {
      if (!detail.medicine_id) {
        alert("Medicine ID is missing in packing details.");
        return;
      }
      if (!detail.selected_packages || !Array.isArray(detail.selected_packages)) {
        alert("Selected packages must be an array.");
        return;
      }

      for (const sp of detail.selected_packages) {
        if (!sp.package_id) {
          alert("Package ID is missing in selected packages.");
          return;
        }
        if (typeof sp.quantity !== "number" || sp.quantity < 0) {
          alert("Quantity must be a non-negative number.");
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
      const confirmContinue = window.confirm(
        "Một số mặt hàng chưa đạt số lượng yêu cầu. Bạn có muốn tiếp tục cập nhật không?"
      );
      if (!confirmContinue) return;
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getAuthToken();
      if (!token) {
        alert("Không có token xác thực. Vui lòng đăng nhập lại.");
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

      console.log("Payload Details:", JSON.stringify(payloadDetails, null, 2));

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
      setExportOrders((prev) =>
        prev.map((order) => (order._id === selectedOrder._id ? updatedOrder.data : order))
      );
      handleClosePackingDialog();
    } catch (error) {
      console.error("Error updating packing:", error);
      alert(`Cập nhật đóng gói thất bại: ${error.message || ""}`);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    const order = exportOrders.find((o) => o._id === orderId)
    if (!order) {
      alert("Không tìm thấy đơn hàng!")
      return
    }

    // Frontend check for approved status
    if (order.status !== "approved") {
      alert("Đơn hàng phải được duyệt trước khi hoàn thành!")
      return
    }

    const confirmAction = window.confirm("Bạn có chắc chắn muốn hoàn thành đơn hàng này không? Số lượng gói hàng sẽ được cập nhật và thay đổi vị trí sẽ được ghi lại.")
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
        throw new Error(errorData.message || "Không thể hoàn thành đơn hàng")
      }

      const updatedOrder = await res.json()
      setExportOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder.data : order)))
      alert("Đơn hàng đã hoàn thành! Số lượng gói hàng đã được cập nhật và thay đổi vị trí đã được ghi lại.")
    } catch (error) {
      console.error("Error completing order:", error)
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
      <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 8px 0" }}>Quản lý Kho Dược phẩm</h1>
        <p style={{ color: "#666", margin: 0 }}>Phân công nhân viên và quản lý đóng gói đơn hàng xuất kho</p>
        <p style={{ fontSize: "12px", color: "#999" }}>Vai trò hiện tại: {currentUserRole}</p>
      </div>
      {/* Statistics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Chờ xử lý</h3>
            <span>📦</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{approvedOrders.length}</div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Đã phân công</h3>
            <span>👥</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{approvedOrders.filter((order) => order.warehouse_manager_id).length}</div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Hoàn thành</h3>
            <span>✅</span>
          </div>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{completedOrders.length}</div>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
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
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id?.contract_code || "N/A"}</td>
                      <td style={{ padding: "12px" }}>{order.created_by.email}</td>
                      <td style={{ padding: "12px" }}>{order.warehouse_manager_id ? order.warehouse_manager_id.email : "Chưa phân công"}</td>
                      <td style={{ padding: "12px" }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: "12px" }}>{new Date(order.createdAt).toLocaleDateString("vi-VN")}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {(currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
                            <button
                              onClick={() => handleOpenPackingDialog(order)}
                              disabled={!order.warehouse_manager_id && currentUserRole === USER_ROLES.WAREHOUSE}
                              style={{
                                padding: "6px 12px",
                                border: "1px solid #d1d5db",
                                backgroundColor: order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER ? "white" : "#f3f4f6",
                                borderRadius: "4px",
                                cursor: order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER ? "pointer" : "not-allowed",
                                fontSize: "12px",
                                color: order.warehouse_manager_id || currentUserRole === USER_ROLES.WAREHOUSEMANAGER ? "black" : "#9ca3af",
                              }}
                            >
                              Đóng gói
                            </button>
                          )}
                          {currentUserRole === USER_ROLES.WAREHOUSEMANAGER && (
                            <>
                              <button
                                onClick={() => handleCompleteOrder(order._id)}
                                style={{ padding: "6px 12px", border: "none", backgroundColor: "#3b82f6", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                Hoàn thành
                              </button>
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                style={{ padding: "6px 12px", border: "none", backgroundColor: "#ef4444", color: "white", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                Hủy
                              </button>
                            </>
                          )}
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
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id?.contract_code || "N/A"}</td>
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
                      <td style={{ padding: "12px", fontWeight: "500" }}>{order.contract_id?.contract_code || "N/A"}</td>
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
      {/* Packing Dialog */}
      {packingDialogOpen && (currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "90%", maxWidth: "700px", maxHeight: "90vh", overflow: "auto" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600" }}>Cập nhật số lượng đóng gói</h2>
            <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: "14px" }}>
              Chọn thùng hàng và nhập số lượng thực tế cho đơn hàng {selectedOrder?.contract_id?.contract_code || "N/A"}
            </p>
            <div style={{ marginBottom: "20px", maxHeight: "400px", overflow: "auto" }}>
              {packingDetails.map((detail) => {
                const medicineName = selectedOrder.details.find(d => d.medicine_id._id === detail.medicine_id)?.medicine_id.medicine_name || "Unknown"
                const unitOfMeasure = selectedOrder.details.find(d => d.medicine_id._id === detail.medicine_id)?.medicine_id.unit_of_measure || "Unknown"
                return (
                  <div key={detail.medicine_id} style={{ padding: "16px", border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: "12px" }}>
                    <div style={{ fontWeight: "500", marginBottom: "8px" }}>{medicineName} - Yêu cầu: {detail.expected_quantity} {unitOfMeasure}</div>
                    <div style={{ marginBottom: "8px" }}>
                      {detail.selected_packages.map((sp) => {
                        const pkg = availablePackages[detail.medicine_id]?.find((p) => p._id === sp.package_id)
                        return (
                          <div key={sp.package_id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span>{pkg ? `${pkg.batch.batch_code} - Package ${pkg._id} (Còn: ${pkg.quantity})` : "Gói không xác định"}</span>
                            <input
                              type="number"
                              min="0"
                              max={pkg?.quantity || 0}
                              value={sp.quantity}
                              onChange={(e) => handleQuantityChange(detail.medicine_id, sp.package_id, e.target.value)}
                              style={{
                                width: "80px",
                                padding: "4px",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "14px",
                              }}
                              disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER}
                            />
                            <button
                              onClick={() => removePackage(detail.medicine_id, sp.package_id)}
                              style={{ padding: "4px 8px", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "4px", cursor: "pointer" }}
                              disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER}
                            >
                              Xóa
                            </button>
                          </div>
                        )
                      })}
                    </div>
                    <button
                      onClick={() => setShowingPackageListFor(detail.medicine_id)}
                      style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer" }}
                      disabled={currentUserRole === USER_ROLES.WAREHOUSEMANAGER}
                    >
                      Thêm thùng hàng
                    </button>
                    {showingPackageListFor === detail.medicine_id && (
                      <div style={{ marginTop: "8px", border: "1px solid #e5e7eb", padding: "8px", borderRadius: "4px" }}>
                        {availablePackages[detail.medicine_id]?.filter((pkg) => !detail.selected_packages.some((sp) => sp.package_id === pkg._id)).map((pkg) => (
                          <div key={pkg._id} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span>{pkg.batch.batch_code} - Package {pkg._id} (Còn: {pkg.quantity})</span>
                            <button
                              onClick={() => addPackage(detail.medicine_id, pkg._id)}
                              style={{ padding: "4px 8px", border: "1px solid #3b82f6", color: "#3b82f6", borderRadius: "4px", cursor: "pointer" }}
                            >
                              Chọn
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowingPackageListFor(null)}
                          style={{ padding: "4px 8px", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", marginTop: "8px" }}
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                    <div style={{ marginTop: "8px" }}>
                      Tổng chọn: {detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0)} / {detail.expected_quantity}
                      {currentUserRole === USER_ROLES.WAREHOUSE && detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0) < detail.expected_quantity && (
                        <span style={{ color: "#ef4444" }}> (Thiếu {detail.expected_quantity - detail.selected_packages.reduce((sum, sp) => sum + sp.quantity, 0)})</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleClosePackingDialog}
                style={{ padding: "8px 16px", border: "1px solid #d1d5db", backgroundColor: "white", borderRadius: "4px", cursor: "pointer" }}
              >
                Hủy
              </button>
              {(currentUserRole === USER_ROLES.WAREHOUSE || currentUserRole === USER_ROLES.WAREHOUSEMANAGER) && (
                <button
                  onClick={handleUpdatePacking}
                  style={{ padding: "8px 16px", border: "none", backgroundColor: "#3b82f6", color: "white", borderRadius: "4px", cursor: "pointer" }}
                >
                  Cập nhật
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}