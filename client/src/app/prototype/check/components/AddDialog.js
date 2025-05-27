"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

export default function AddDialog({ open, onClose, onAdd }) {
  const [drugName, setDrugName] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [requirements, setRequirements] = useState([]);

  const [newCriteria, setNewCriteria] = useState("");
  const [newExpected, setNewExpected] = useState("");

  const handleAddRequirement = () => {
    if (newCriteria.trim() && newExpected.trim()) {
      setRequirements((prev) => [
        ...prev,
        { criteria: newCriteria, expected: newExpected },
      ]);
      setNewCriteria("");
      setNewExpected("");
    }
  };

  const handleRemoveRequirement = (index) => {
    setRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!drugName || !batchCode || !createdBy) {
      alert("Vui lòng điền đầy đủ thông tin thuốc, số lô và người tạo.");
      return;
    }
    if (requirements.length === 0) {
      alert("Vui lòng thêm ít nhất một tiêu chí kiểm định.");
      return;
    }
    const newRecord = {
      id: Date.now(),
      drugName,
      batchCode,
      createdBy,
      createdDate: new Date().toISOString().split("T")[0],
      status: "pending",
      requirements,
      images: [],
      testResults: [],
    };
    onAdd(newRecord);
    onClose();
    setDrugName("");
    setBatchCode("");
    setCreatedBy("");
    setRequirements([]);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Tạo phiếu yêu cầu kiểm định mới</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Tên thuốc"
          fullWidth
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Số lô"
          fullWidth
          value={batchCode}
          onChange={(e) => setBatchCode(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Người tạo"
          fullWidth
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          sx={{ mb: 2 }}
        />

        <Typography variant="subtitle1" gutterBottom>
          Thêm tiêu chí kiểm định:
        </Typography>

        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tiêu chí</TableCell>
              <TableCell>Expected</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Dòng các yêu cầu đã thêm */}
            {requirements.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.criteria}</TableCell>
                <TableCell>{r.expected}</TableCell>
                <TableCell>
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleRemoveRequirement(idx)}
                  >
                    Xóa
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {/* Dòng nhập mới: chỉ 2 cột, không có cột hành động */}
            <TableRow>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Tiêu chí mới"
                  value={newCriteria}
                  onChange={(e) => setNewCriteria(e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <TextField
                  size="small"
                  placeholder="Expected"
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  fullWidth
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddRequirement}
                  disabled={!newCriteria.trim() || !newExpected.trim()}
                >
                  Thêm
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Tạo mới
        </Button>
      </DialogActions>
    </Dialog>
  );
}
