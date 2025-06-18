"use client";
import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, Dialog } from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetail from './PurchaseOrderDetail';

export default function PurchaseOrderTable() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchase-orders');
      const data = await res.json();
      setOrders(data.data || []);
    } catch (err) {
      setOrders([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAdd = () => {
    setEditOrder(null);
    setOpenForm(true);
  };
  const handleEdit = (order) => {
    setEditOrder(order);
    setOpenForm(true);
  };
  const handleDetail = (order) => {
    setDetailOrder(order);
    setOpenDetail(true);
  };
  const handleDelete = async (orderId) => {
    if (window.confirm('Bạn có chắc muốn xóa đơn này?')) {
      await fetch(`/api/purchase-orders/${orderId}`, { method: 'DELETE' });
      fetchOrders();
    }
  };
  const handleFormClose = (refresh) => {
    setOpenForm(false);
    setEditOrder(null);
    if (refresh) fetchOrders();
  };
  const handleDetailClose = () => {
    setOpenDetail(false);
    setDetailOrder(null);
  };

  return (
    <>
      <Button variant="contained" startIcon={<Add />} onClick={handleAdd} sx={{ mb: 2 }}>
        Thêm mới
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã đơn</TableCell>
              <TableCell>Người tạo</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order._id}</TableCell>
                <TableCell>{order.created_by?.name || order.created_by?._id}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleDetail(order)}><Visibility /></IconButton>
                  <IconButton onClick={() => handleEdit(order)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(order._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && !loading && (
              <TableRow><TableCell colSpan={5} align="center">Không có dữ liệu</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openForm} onClose={() => handleFormClose(false)} maxWidth="sm" fullWidth>
        <PurchaseOrderForm order={editOrder} onClose={handleFormClose} />
      </Dialog>
      <Dialog open={openDetail} onClose={handleDetailClose} maxWidth="sm" fullWidth>
        <PurchaseOrderDetail order={detailOrder} onClose={handleDetailClose} />
      </Dialog>
    </>
  );
} 