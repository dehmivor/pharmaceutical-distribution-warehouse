'use client';

import React, { useState } from 'react';

function InspectionPage() {
  const [inspectionData, setInspectionData] = useState({
    inspectionId: '',
    date: new Date().toISOString().split('T')[0],
    inspector: '',
    location: '',
    items: [],
    notes: '',
    status: 'pending'
  });

  const [currentItem, setCurrentItem] = useState({
    name: '',
    condition: 'good',
    notes: ''
  });

  const handleAddItem = () => {
    if (currentItem.name.trim()) {
      setInspectionData((prev) => ({
        ...prev,
        items: [...prev.items, { ...currentItem, id: Date.now() }]
      }));
      setCurrentItem({ name: '', condition: 'good', notes: '' });
    }
  };

  const handleRemoveItem = (id) => {
    setInspectionData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu phiếu kiểm tra:', inspectionData);
    // Xử lý submit form ở đây
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">PHIẾU KIỂM TRA</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin chung */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mã phiếu kiểm tra</label>
            <input
              type="text"
              value={inspectionData.inspectionId}
              onChange={(e) => setInspectionData((prev) => ({ ...prev, inspectionId: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nhập mã phiếu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kiểm tra</label>
            <input
              type="date"
              value={inspectionData.date}
              onChange={(e) => setInspectionData((prev) => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Người kiểm tra</label>
            <input
              type="text"
              value={inspectionData.inspector}
              onChange={(e) => setInspectionData((prev) => ({ ...prev, inspector: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tên người kiểm tra"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm</label>
            <input
              type="text"
              value={inspectionData.location}
              onChange={(e) => setInspectionData((prev) => ({ ...prev, location: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Địa điểm kiểm tra"
            />
          </div>
        </div>

        {/* Thêm mục kiểm tra */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Thêm mục kiểm tra</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={currentItem.name}
              onChange={(e) => setCurrentItem((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Tên mục kiểm tra"
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <select
              value={currentItem.condition}
              onChange={(e) => setCurrentItem((prev) => ({ ...prev, condition: e.target.value }))}
              className="p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="good">Tốt</option>
              <option value="fair">Khá</option>
              <option value="poor">Kém</option>
              <option value="damaged">Hỏng</option>
            </select>

            <button
              type="button"
              onClick={handleAddItem}
              className="bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-colors"
            >
              Thêm mục
            </button>
          </div>

          <input
            type="text"
            value={currentItem.notes}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Ghi chú cho mục này"
            className="w-full mt-3 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Danh sách mục đã thêm */}
        {inspectionData.items.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Danh sách kiểm tra</h3>
            <div className="space-y-3">
              {inspectionData.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <span
                      className={`ml-3 px-2 py-1 rounded text-sm ${
                        item.condition === 'good'
                          ? 'bg-green-100 text-green-800'
                          : item.condition === 'fair'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.condition === 'poor'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.condition === 'good' ? 'Tốt' : item.condition === 'fair' ? 'Khá' : item.condition === 'poor' ? 'Kém' : 'Hỏng'}
                    </span>
                    {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                  </div>
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 ml-4">
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ghi chú chung */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú chung</label>
          <textarea
            value={inspectionData.notes}
            onChange={(e) => setInspectionData((prev) => ({ ...prev, notes: e.target.value }))}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập ghi chú chung về quá trình kiểm tra..."
          />
        </div>

        {/* Trạng thái */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
          <select
            value={inspectionData.status}
            onChange={(e) => setInspectionData((prev) => ({ ...prev, status: e.target.value }))}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pending">Đang kiểm tra</option>
            <option value="completed">Hoàn thành</option>
            <option value="requires_action">Cần xử lý</option>
          </select>
        </div>

        {/* Nút submit */}
        <div className="flex justify-center pt-6">
          <button type="submit" className="bg-green-500 text-white px-8 py-3 rounded-md hover:bg-green-600 transition-colors font-semibold">
            Lưu phiếu kiểm tra
          </button>
        </div>
      </form>
    </div>
  );
}

export default InspectionPage;
