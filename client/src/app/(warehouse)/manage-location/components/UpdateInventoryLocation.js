"use client"

import { useState, useEffect } from "react"
import "../components/UpdateInventoryLocation.css"

const UpdateInventoryLocation = () => {
  const [packages, setPackages] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [newLocationId, setNewLocationId] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")

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
        console.error("Error fetching packages:", result.message)
      }
    } catch (error) {
      console.error("Error fetching packages:", error)
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
        console.error("Error fetching locations:", result.message)
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const handleUpdateLocation = async (packageId) => {
    if (!newLocationId) {
      alert("Vui lòng chọn vị trí mới")
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

        alert("Cập nhật vị trí thành công!")
      } else {
        alert("Lỗi: " + result.message)
      }
    } catch (error) {
      console.error("Error updating location:", error)
      alert("Có lỗi xảy ra khi cập nhật vị trí")
    } finally {
      setUpdating(false)
    }
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
        return "#28a745"
      case "CHECKING":
        return "#ffc107"
      case "DAMAGED":
        return "#dc3545"
      default:
        return "#6c757d"
    }
  }

  const getQualityStatusColor = (status) => {
    switch (status) {
      case "GOOD":
        return "#28a745"
      case "DAMAGED":
        return "#dc3545"
      case "EXPIRED":
        return "#dc3545"
      case "PENDING":
        return "#ffc107"
      default:
        return "#6c757d"
    }
  }

  if (loading) {
    return <div className="loading">Đang tải dữ liệu...</div>
  }

  return (
    <div className="update-inventory-container">
      <div className="header">
        <h1>Cập Nhật Vị Trí Thùng Hàng</h1>
        <div className="filters">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã thùng hoặc mã lô..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="filter-select">
            <option value="">Tất cả vị trí</option>
            {locations.map((location) => (
              <option key={location._id} value={location._id}>
                {location.position} - {location.area_id?.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="packages-grid">
        {filteredPackages.map((pkg) => (
          <div key={pkg._id} className="package-card">
            <div className="package-header">
              <h3>{pkg.package_code}</h3>
              <div className="status-badges">
                <span className="status-badge" style={{ backgroundColor: getStatusColor(pkg.status) }}>
                  {pkg.status}
                </span>
                <span className="quality-badge" style={{ backgroundColor: getQualityStatusColor(pkg.quality_status) }}>
                  {pkg.quality_status}
                </span>
              </div>
            </div>

            <div className="package-info">
              <div className="info-row">
                <span className="label">Mã lô:</span>
                <span>{pkg.batch_id?.batch_code || "N/A"}</span>
              </div>
              <div className="info-row">
                <span className="label">Số lượng:</span>
                <span>{pkg.quantity}</span>
              </div>
              <div className="info-row">
                <span className="label">Vị trí hiện tại:</span>
                <span className="current-location">
                  {pkg.location_id?.position || "Chưa có"}
                  {pkg.location_id?.area_id?.name && ` - ${pkg.location_id.area_id.name}`}
                </span>
              </div>
              <div className="info-row">
                <span className="label">Kích thước:</span>
                <span>
                  {pkg.capacity?.length} x {pkg.capacity?.width}
                </span>
              </div>
            </div>

            <div className="update-section">
              {selectedPackage === pkg._id ? (
                <div className="update-form">
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="location-select"
                  >
                    <option value="">Chọn vị trí mới</option>
                    {locations
                      .filter((loc) => loc._id !== pkg.location_id?._id)
                      .map((location) => (
                        <option key={location._id} value={location._id}>
                          {location.position} - {location.area_id?.name}
                          {` (${location.capacity.length}x${location.capacity.width})`}
                        </option>
                      ))}
                  </select>
                  <div className="form-actions">
                    <button
                      onClick={() => handleUpdateLocation(pkg._id)}
                      disabled={updating || !newLocationId}
                      className="btn-update"
                    >
                      {updating ? "Đang cập nhật..." : "Cập nhật"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPackage(null)
                        setNewLocationId("")
                      }}
                      className="btn-cancel"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSelectedPackage(pkg._id)} className="btn-change-location">
                  Thay đổi vị trí
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="no-data">Không tìm thấy thùng hàng nào phù hợp với bộ lọc.</div>
      )}
    </div>
  )
}

export default UpdateInventoryLocation
