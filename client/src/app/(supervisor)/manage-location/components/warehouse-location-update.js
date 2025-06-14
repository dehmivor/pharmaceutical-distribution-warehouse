"use client"

import { useState, useEffect, useMemo } from "react";
import { Search, Package, MapPin, Edit, Save, X, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Danh sách các khu vực và vị trí có sẵn (dùng để chọn vị trí mới)
const availableLocations = {
  A: {
    name: "Khu A - Thuốc thường",
    description: "Nhiệt độ phòng (15-30°C)",
    shelves: ["01", "02", "03", "04", "05", "06"],
    positions: ["01", "02", "03", "04", "05", "06"],
  },
  B: {
    name: "Khu B - Thuốc lạnh",
    description: "Bảo quản lạnh (2-8°C)",
    shelves: ["01", "02", "03", "04"],
    positions: ["01", "02", "03", "04", "05"],
  },
  C: {
    name: "Khu C - Thuốc kiểm soát đặc biệt",
    description: "Khu vực bảo mật cao",
    shelves: ["01", "02", "03"],
    positions: ["01", "02", "03", "04"],
  },
};

export default function WarehouseLocationUpdate() {
  const [boxes, setBoxes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBox, setSelectedBox] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    zone: "",
    shelf: "",
    position: "",
    notes: "",
  });

  // Fetch dữ liệu từ API khi component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/location/locations-with-batches")
      .then((res) => res.json())
      .then((data) => {
        // Chuyển đổi dữ liệu API thành định dạng phù hợp với initialBoxes
        const formattedBoxes = data.map((loc) => ({
          id: loc._id,
          code: loc.batch_info[0]?.batch_code || "N/A",
          supplierName: loc.batch_info[0]?.supplier_id || "N/A", // Cần ánh xạ từ supplier_id nếu có
          contractType: "N/A", // Cần lấy từ hợp đồng nếu có API
          drugName: loc.batch_info[0]?.medicine_id || "N/A", // Cần ánh xạ từ medicine_id
          activeIngredient: "N/A", // Cần thêm từ Medicine model
          manufacturer: "N/A", // Cần thêm từ Medicine model
          batchNumber: loc.batch_info[0]?.batch_code || "N/A",
          registrationNumber: "N/A", // Cần thêm từ Medicine model
          quantity: loc.batch_info[0]?.quantity || 0,
          unit: "N/A", // Cần thêm từ Medicine model
          currentLocation: loc.position,
          zone: loc.position.split("-")[0],
          shelf: loc.position.split("-")[1],
          position: loc.position.split("-")[2],
          status: loc.available ? "Đã nhập kho" : "Chờ kiểm kê",
          expiryDate: loc.batch_info[0]?.expiry_date || "N/A",
          storageCondition: "Nhiệt độ phòng", // Cần ánh xạ từ Medicine hoặc Batch
          lastUpdated: loc.updated_at || new Date().toISOString().split("T")[0],
        }));
        setBoxes(formattedBoxes);
      })
      .catch((error) => console.error("Error fetching boxes:", error));
  }, []);

  // Lọc và tìm kiếm
  const filteredBoxes = useMemo(() => {
    return boxes.filter((box) => {
      const matchesSearch =
        box.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.drugName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.currentLocation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesZone = filterZone === "all" || box.zone === filterZone;
      const matchesStatus = filterStatus === "all" || box.status === filterStatus;

      return matchesSearch && matchesZone && matchesStatus;
    });
  }, [boxes, searchTerm, filterZone, filterStatus]);

  // Mở dialog chỉnh sửa
  const handleEditLocation = (box) => {
    setSelectedBox(box);
    setEditForm({
      zone: box.zone,
      shelf: box.shelf,
      position: box.position,
      notes: "",
    });
    setIsEditDialogOpen(true);
  };

  // Cập nhật vị trí qua API
  const handleUpdateLocation = async () => {
    if (!selectedBox || !editForm.zone || !editForm.shelf || !editForm.position) {
      alert("Vui lòng điền đầy đủ thông tin vị trí!");
      return;
    }

    const newLocation = `${editForm.zone}-${editForm.shelf}-${editForm.position}`;
    // Kiểm tra trùng lặp vị trí trong danh sách hiện tại (trước khi gửi API)
    const locationExists = boxes.some(
      (box) => box.id !== selectedBox.id && box.currentLocation === newLocation
    );
    if (locationExists) {
      alert("Vị trí này đã có thùng khác! Vui lòng chọn vị trí khác.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/assign-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: selectedBox.id,
          batchCode: selectedBox.batchNumber,
          quantity: selectedBox.quantity,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setBoxes((prevBoxes) =>
          prevBoxes.map((box) =>
            box.id === selectedBox.id
              ? {
                  ...box,
                  currentLocation: newLocation,
                  zone: editForm.zone,
                  shelf: editForm.shelf,
                  position: editForm.position,
                  lastUpdated: new Date().toISOString().split("T")[0],
                }
              : box
          )
        );
        setIsEditDialogOpen(false);
        setSelectedBox(null);
        alert(`Đã cập nhật vị trí thùng ${selectedBox.code} thành công!`);
      } else {
        alert(data.message || "Cập nhật vị trí thất bại!");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      alert("Có lỗi xảy ra khi cập nhật vị trí!");
    }
  };

  // Lấy màu badge theo trạng thái
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Đã nhập kho":
        return "default";
      case "Chờ kiểm kê":
        return "secondary";
      case "Đang kiểm kê":
        return "outline";
      default:
        return "default";
    }
  };

  // Lấy màu badge theo loại hợp đồng
  const getContractBadgeVariant = (type) => {
    return type === "KPI" ? "destructive" : "outline";
  };

  // Kiểm tra thuốc sắp hết hạn (trong vòng 6 tháng)
  const isExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    return expiry <= sixMonthsFromNow;
  };

  // Lấy màu badge theo điều kiện bảo quản
  const getStorageConditionVariant = (condition) => {
    switch (condition) {
      case "Nhiệt độ phòng":
        return "default";
      case "2-8°C":
        return "secondary";
      case "Kiểm soát đặc biệt":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý vị trí thuốc trong kho</h1>
          <p className="text-muted-foreground">Cập nhật và theo dõi vị trí các lô thuốc trong kho dược</p>
        </div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          <span className="font-semibold">Tổng: {boxes.length} thùng</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Tên thuốc, số lô, nhà sản xuất, hoạt chất..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zone-filter">Khu vực</Label>
              <Select value={filterZone} onValueChange={setFilterZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  {Object.entries(availableLocations).map(([zone, info]) => (
                    <SelectItem key={zone} value={zone}>
                      {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-filter">Trạng thái</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="Đã nhập kho">Đã nhập kho</SelectItem>
                  <SelectItem value="Chờ kiểm kê">Chờ kiểm kê</SelectItem>
                  <SelectItem value="Đang kiểm kê">Đang kiểm kê</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kết quả</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm">{filteredBoxes.length} thùng</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thùng hàng</CardTitle>
          <CardDescription>Nhấn vào nút chỉnh sửa để cập nhật vị trí thùng hàng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lô</TableHead>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Hoạt chất</TableHead>
                  <TableHead>Nhà sản xuất</TableHead>
                  <TableHead>Số lô</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Điều kiện bảo quản</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoxes.map((box) => (
                  <TableRow key={box.id}>
                    <TableCell className="font-medium">{box.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{box.drugName}</div>
                        <div className="text-sm text-muted-foreground">SĐK: {box.registrationNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>{box.activeIngredient}</TableCell>
                    <TableCell>{box.manufacturer}</TableCell>
                    <TableCell className="font-mono">{box.batchNumber}</TableCell>
                    <TableCell>
                      {box.quantity} {box.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{box.currentLocation}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStorageConditionVariant(box.storageCondition)}>
                        {box.storageCondition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={`${isExpiringSoon(box.expiryDate) ? "text-red-600 font-medium" : ""}`}>
                        {box.expiryDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(box.status)}>{box.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditLocation(box)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Sửa vị trí
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cập nhật vị trí lô thuốc</DialogTitle>
            <DialogDescription>
              Lô thuốc: {selectedBox?.code} - {selectedBox?.drugName}
              <br />
              Số lô: {selectedBox?.batchNumber} | HSD: {selectedBox?.expiryDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vị trí hiện tại</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <MapPin className="h-4 w-4" />
                  <span className="font-mono">{selectedBox?.currentLocation}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <div className="p-2 bg-muted rounded-md">{selectedBox?.quantity} sản phẩm</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Vị trí mới</h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zone">Khu vực</Label>
                  <Select
                    value={editForm.zone}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, zone: value, shelf: "", position: "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khu" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableLocations).map(([zone, info]) => (
                        <SelectItem key={zone} value={zone}>
                          Khu {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelf">Kệ</Label>
                  <Select
                    value={editForm.shelf}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, shelf: value, position: "" }))}
                    disabled={!editForm.zone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kệ" />
                    </SelectTrigger>
                    <SelectContent>
                      {editForm.zone &&
                        availableLocations[editForm.zone]?.shelves.map((shelf) => (
                          <SelectItem key={shelf} value={shelf}>
                            Kệ {shelf}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Vị trí</Label>
                  <Select
                    value={editForm.position}
                    onValueChange={(value) => setEditForm((prev) => ({ ...prev, position: value }))}
                    disabled={!editForm.shelf}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vị trí" />
                    </SelectTrigger>
                    <SelectContent>
                      {editForm.zone &&
                        availableLocations[editForm.zone]?.positions.map((position) => (
                          <SelectItem key={position} value={position}>
                            Vị trí {position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editForm.zone && editForm.shelf && editForm.position && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      Vị trí mới: {editForm.zone}-{editForm.shelf}-{editForm.position}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
                <Textarea
                  id="notes"
                  placeholder="Ghi chú về việc di chuyển thùng hàng..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Hủy
            </Button>
            <Button onClick={handleUpdateLocation}>
              <Save className="h-4 w-4 mr-1" />
              Cập nhật vị trí
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}