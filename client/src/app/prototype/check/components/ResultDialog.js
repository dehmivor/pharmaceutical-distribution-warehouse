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
  TableCell
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

export default function ResultDialog({ open, onClose, data, onUpdate }) {
  const [results, setResults] = useState([]);
  const [resultImage, setResultImage] = useState('');
  const isEditable = data?.status === 'success';

  useEffect(() => {
    if (data && data.requirements) {
      const existingResults = data.result?.details || [];
      const resultMap = new Map(existingResults.map((r) => [r.criteria, r]));

      const updated = data.requirements.map((req) => ({
        criteria: req.criteria,
        expected: req.expected,
        actual: resultMap.get(req.criteria)?.actual || ''
      }));

      setResults(updated);
      setResultImage(data.result?.image || '');
    }
  }, [data]);

  const handleChange = (index, key, value) => {
    const newResults = [...results];
    newResults[index][key] = value;
    setResults(newResults);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setResultImage(url);
  };

  const handleSave = () => {
    const result = {
      details: results,
      image: resultImage
    };
    onUpdate({ ...data, result });
    onClose();
  };

  if (!data) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Kết quả kiểm định</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1" gutterBottom>
          Phiếu: {data.drugName} - {data.batchCode}
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tiêu chí</TableCell>
              <TableCell>Mong muốn</TableCell>
              <TableCell>Thực tế</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((r, idx) => (
              <TableRow key={idx}>
                <TableCell>{r.criteria}</TableCell>
                <TableCell>{r.expected}</TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    disabled={!isEditable}
                    value={r.actual}
                    onChange={(e) => handleChange(idx, 'actual', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {resultImage && (
          <div style={{ marginBottom: 16 }}>
            <Typography variant="subtitle2">Ảnh kết quả kiểm định:</Typography>
            <img src={resultImage} alt="phiếu kết quả" style={{ width: 240, borderRadius: 6, marginTop: 8 }} />
          </div>
        )}

        {isEditable && (
          <div style={{ marginBottom: 16 }}>
            <Button component="label" size="small" startIcon={<UploadFileIcon />}>
              Tải ảnh kết quả
              <input hidden type="file" accept="image/*" onChange={handleImageChange} />
            </Button>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
        {isEditable && (
          <Button variant="contained" onClick={handleSave}>
            Lưu kết quả
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
