'use client';

import React, { useState, useEffect } from 'react';
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
  TableBody,
  TableRow,
  TableCell,
  MenuItem
} from '@mui/material';

import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function DetailDialog({ open, onClose, data, onUpdate }) {
  const [drugName, setDrugName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [status, setStatus] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [newCriteria, setNewCriteria] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [images, setImages] = useState([]);

  const canEditFields = data?.status === 'pending';
  const canChangeStatus = data?.status === 'pending' || data?.status === 'sent';

  useEffect(() => {
    if (data) {
      setDrugName(data.drugName || '');
      setBatchCode(data.batchCode || '');
      setCreatedBy(data.createdBy || '');
      setStatus(data.status || '');
      setRequirements(data.requirements || []);
      setImages(data.images || []);
      setNewCriteria('');
      setNewExpected('');
    }
  }, [data]);

  const handleReqChange = (index, key, value) => {
    if (!canEditFields) return;
    const newReqs = [...requirements];
    newReqs[index][key] = value;
    setRequirements(newReqs);
  };

  const handleAddRequirement = () => {
    if (!newCriteria.trim() || !newExpected.trim()) return;
    setRequirements([...requirements, { criteria: newCriteria, expected: newExpected }]);
    setNewCriteria('');
    setNewExpected('');
  };

  const handleRemoveRequirement = (index) => {
    if (!canEditFields) return;
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleImageChange = (e) => {
    if (!canEditFields) return;
    const files = e.target.files;
    if (files.length) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...urls]);
    }
  };

  const handleSave = () => {
    onUpdate({
      ...data,
      drugName,
      batchCode,
      createdBy,
      status,
      requirements,
      images
    });
    onClose();
  };

  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Chi tiết phiếu kiểm định</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Tên thuốc"
          fullWidth
          disabled={!canEditFields}
          value={drugName}
          onChange={(e) => setDrugName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Số lô"
          fullWidth
          disabled={!canEditFields}
          value={batchCode}
          onChange={(e) => setBatchCode(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Người tạo"
          fullWidth
          disabled={!canEditFields}
          value={createdBy}
          onChange={(e) => setCreatedBy(e.target.value)}
          sx={{ mb: 2 }}
        />

        {canChangeStatus ? (
          <TextField label="Trạng thái" fullWidth select value={status} onChange={(e) => setStatus(e.target.value)} sx={{ mb: 2 }}>
            <MenuItem value={status}>{status}</MenuItem>
            {status === 'pending' && <MenuItem value="sent">sent</MenuItem>}
            {status === 'sent' && <MenuItem value="success">success</MenuItem>}
          </TextField>
        ) : (
          <TextField label="Trạng thái" fullWidth disabled value={status} sx={{ mb: 2 }} />
        )}

        <Typography variant="subtitle1" gutterBottom>
          Tiêu chí kiểm định:
        </Typography>

        <Table size="small" sx={{ mb: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tiêu chí</TableCell>
              <TableCell>Expected</TableCell>
              {canEditFields && <TableCell>Hành động</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {requirements.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  {canEditFields ? (
                    <TextField value={r.criteria} onChange={(e) => handleReqChange(idx, 'criteria', e.target.value)} size="small" />
                  ) : (
                    r.criteria
                  )}
                </TableCell>
                <TableCell>
                  {canEditFields ? (
                    <TextField value={r.expected} onChange={(e) => handleReqChange(idx, 'expected', e.target.value)} size="small" />
                  ) : (
                    r.expected
                  )}
                </TableCell>
                {canEditFields && (
                  <TableCell>
                    <Button color="error" size="small" onClick={() => handleRemoveRequirement(idx)}>
                      Xóa
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {canEditFields && (
              <TableRow>
                <TableCell>
                  <TextField size="small" placeholder="Tiêu chí mới" value={newCriteria} onChange={(e) => setNewCriteria(e.target.value)} />
                </TableCell>
                <TableCell>
                  <TextField size="small" placeholder="Expected" value={newExpected} onChange={(e) => setNewExpected(e.target.value)} />
                </TableCell>
                <TableCell>
                  <Button variant="contained" size="small" onClick={handleAddRequirement}>
                    Thêm
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Typography variant="subtitle1" gutterBottom>
          Ảnh đính kèm:
        </Typography>

        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            {images.map((img, idx) => (
              <img key={idx} src={img} alt="Attachment" width={80} height={80} style={{ objectFit: 'cover', borderRadius: 4 }} />
            ))}
          </div>
        )}

        {canEditFields && (
          <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
            Tải ảnh lên
            <input hidden type="file" multiple onChange={handleImageChange} />
          </Button>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        {(canEditFields || canChangeStatus) && (
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
