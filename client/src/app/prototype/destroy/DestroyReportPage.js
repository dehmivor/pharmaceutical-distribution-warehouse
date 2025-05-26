"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

function DestroyReportPage() {
  const [form, setForm] = useState({
    transaction_name: `Dispose-${new Date()
      .toISOString()
      .replace(/[:T]/g, "-")
      .split(".")[0]}`,
    drugName: "",
    lotNumber: "",
    quantity: "",
    reason: "",
    note: "",
  });

  const [destroyList, setDestroyList] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDestroyList();
  }, []);

  const fetchDestroyList = async () => {
    try {
      console.log("Đang gọi API để lấy danh sách phiếu báo hủy...");
      const response = await fetch("http://localhost:5000/api/destroy", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Phản hồi từ API:", response);

      const data = await response.json();
      console.log("Dữ liệu từ API:", data);

      if (response.ok) {
        setDestroyList(data);
        setError(null);
      } else {
        setError(data.message || "Lỗi khi lấy danh sách phiếu báo hủy");
        setDestroyList([]);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
      setError("Lỗi kết nối server: " + err.message);
      setDestroyList([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(false);
    setError(null);

    try {
      console.log("Đang gửi yêu cầu tạo phiếu báo hủy:", form);
      const response = await fetch("http://localhost:5000/api/destroy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_name: form.transaction_name,
          drugName: form.drugName,
          lotNumber: form.lotNumber,
          quantity: parseInt(form.quantity),
          reason: form.reason,
          notes: form.note,
        }),
      });

      const result = await response.json();
      console.log("Kết quả từ API POST:", result);

      if (response.ok) {
        setSubmitted(true);
        setForm({
          transaction_name: `Dispose-${new Date()
            .toISOString()
            .replace(/[:T]/g, "-")
            .split(".")[0]}`,
          drugName: "",
          lotNumber: "",
          quantity: "",
          reason: "",
          note: "",
        });
        fetchDestroyList();
      } else {
        setError(result.message || "Lỗi khi tạo phiếu báo hủy");
      }
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu POST:", err);
      setError("Lỗi kết nối server: " + err.message);
    }
  };

  const handleApprove = async (id) => {
    try {
      console.log("Đang phê duyệt phiếu báo hủy với ID:", id);
      const response = await fetch(`http://localhost:5000/api/destroy/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_by: "supervisor_id", status: "Approved" }),
      });
      const result = await response.json();
      console.log("Kết quả từ API PUT:", result);

      if (response.ok) {
        fetchDestroyList();
      } else {
        setError(result.message || "Lỗi khi phê duyệt");
      }
    } catch (err) {
      console.error("Lỗi khi phê duyệt:", err);
      setError("Lỗi kết nối server: " + err.message);
    }
  };

  const currentTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <Box maxWidth={800} mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Phiếu báo hủy thuốc
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Thời gian hiện tại: {currentTime}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Tên phiếu"
            name="transaction_name"
            value={form.transaction_name}
            fullWidth
            margin="normal"
            disabled
          />
          <TextField
            label="Tên thuốc"
            name="drugName"
            value={form.drugName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Số lô"
            name="lotNumber"
            value={form.lotNumber}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Số lượng hủy"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Lý do hủy"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Ghi chú"
            name="note"
            value={form.note}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={2}
          />
          <Box mt={2}>
            <Button type="submit" variant="contained" color="error" fullWidth>
              Tạo phiếu báo hủy
            </Button>
          </Box>
        </form>
        {submitted && (
          <Typography color="success.main" mt={2}>
            Đã gửi phiếu báo hủy thành công!
          </Typography>
        )}
        {error && (
          <Typography color="error.main" mt={2}>
            {error}
          </Typography>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Danh sách phiếu báo hủy
        </Typography>
        {destroyList.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tên phiếu</TableCell>
                  <TableCell>Tên thuốc</TableCell>
                  <TableCell>Số lô</TableCell>
                  <TableCell>Số lượng</TableCell>
                  <TableCell>Lý do hủy</TableCell>
                  <TableCell>Ghi chú</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {destroyList.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.transaction_name}</TableCell>
                    <TableCell>{item.drugName}</TableCell>
                    <TableCell>{item.lotNumber}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.notes}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="warning"
                        size="small"
                        onClick={() => handleApprove(item._id)}
                        disabled={item.status !== "Pending"}
                      >
                        Phê duyệt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography>Chưa có phiếu báo hủy nào.</Typography>
        )}
      </Paper>
    </Box>
  );
}

export default DestroyReportPage;