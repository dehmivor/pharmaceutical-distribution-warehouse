'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import DetailDialog from './DetailDialog';
import ResultDialog from './ResultDialog';
import AddDialog from './AddDialog';

const mockData = [
  {
    id: 1,
    drugName: 'Paracetamol',
    batchCode: 'PA202501',
    createdBy: 'warehouse1',
    createdDate: '2025-05-20',
    status: 'pending', // pending, sent, success
    requirements: [
      { criteria: 'Hàm lượng hoạt chất', expected: '95-105%' },
      { criteria: 'Độ hòa tan', expected: '≥80% trong 30 phút' }
    ],
    images: [],
    result: null
  },
  {
    id: 2,
    drugName: 'Amoxicillin',
    batchCode: 'AMX0525A',
    createdBy: 'warehouse2',
    createdDate: '2025-05-18',
    status: 'sent',
    requirements: [{ criteria: 'Độ hòa tan', expected: '≥80% trong 30 phút' }],
    images: [],
    result: null
  },
  {
    id: 3,
    drugName: 'Ibuprofen',
    batchCode: 'IBF3001',
    createdBy: 'warehouse3',
    createdDate: '2025-05-15',
    status: 'success',
    requirements: [{ criteria: 'Hàm lượng hoạt chất', expected: '90-110%' }],
    images: [],
    result: {
      /* kết quả trả về */
    }
  }
];

export default function QualityCheckPage() {
  const [dataList, setDataList] = useState(mockData);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  // Mở dialog chi tiết
  const handleOpenDetail = (item) => {
    setSelected(item);
    setDetailOpen(true);
  };

  // Mở dialog kết quả
  const handleOpenResult = (item) => {
    setSelected(item);
    setResultOpen(true);
  };

  // Cập nhật phiếu kiểm định
  const handleUpdateRequest = (updated) => {
    setDataList((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  // Thêm phiếu mới
  const handleAddRequest = (newReq) => {
    setDataList((prev) => [...prev, { ...newReq, id: prev.length + 1, status: 'pending', images: [], result: null }]);
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Danh sách phiếu kiểm định
        </Typography>
        <Button variant="contained" onClick={() => setNewRequestOpen(true)}>
          + Tạo phiếu mới
        </Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên thuốc</TableCell>
            <TableCell>Số lô</TableCell>
            <TableCell>Người tạo</TableCell>
            <TableCell>Ngày tạo</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Chức năng</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataList.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.drugName}</TableCell>
              <TableCell>{item.batchCode}</TableCell>
              <TableCell>{item.createdBy}</TableCell>
              <TableCell>{item.createdDate}</TableCell>
              <TableCell>{item.status}</TableCell>
              <TableCell>
                <Button variant="outlined" size="small" onClick={() => handleOpenDetail(item)} style={{ marginRight: 8 }}>
                  Chi tiết
                </Button>

                {(item.status === 'sent' || item.status === 'success') && (
                  <Button variant="contained" size="small" color="secondary" onClick={() => handleOpenResult(item)}>
                    Cập nhật kết quả
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DetailDialog open={detailOpen} data={selected} onClose={() => setDetailOpen(false)} onUpdate={handleUpdateRequest} />

      <ResultDialog open={resultOpen} data={selected} onClose={() => setResultOpen(false)} onUpdate={handleUpdateRequest} />

      <AddDialog open={newRequestOpen} onClose={() => setNewRequestOpen(false)} onAdd={handleAddRequest} />
    </div>
  );
}
