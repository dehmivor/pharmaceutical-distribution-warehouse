'use client';
import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from 'axios';

const API_BASE = '/api/parameters';

export default function ParameterManager() {
  const [parameters, setParameters] = useState([]);
  const [filterGroup, setFilterGroup] = useState('');
  const [editValues, setEditValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Dialog state for add new param
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newParam, setNewParam] = useState({
    key: '',
    value: '',
    description: '',
    group: '',
    type: 'string',
    isEditable: true,
  });

  // Load parameters (optionally filter by group)
  async function loadParameters() {
    setLoading(true);
    try {
      const res = await axios.get(API_BASE, {
        params: filterGroup ? { group: filterGroup } : {},
      });
      if (res.data.success) {
        setParameters(res.data.data);
        // Initialize edit values
        const initialEdit = {};
        res.data.data.forEach((p) => (initialEdit[p.key] = p.value));
        setEditValues(initialEdit);
      }
    } catch (error) {
      console.error('Load parameters error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParameters();
  }, [filterGroup]);

  // Handle change in editable field
  function handleEditChange(key, value) {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  }

  // Update parameter
  async function updateParameter(key) {
    try {
      await axios.put(`${API_BASE}/${key}`, {
        value: editValues[key],
      });
      await loadParameters();
      alert('Cập nhật thành công');
    } catch (error) {
      console.error('Update failed:', error);
      alert('Cập nhật thất bại');
    }
  }

  // Handle add new param dialog input change
  function handleNewParamChange(field, value) {
    setNewParam((prev) => ({ ...prev, [field]: value }));
  }

  // Add new parameter
  async function addParameter() {
    if (!newParam.key || !newParam.value) {
      alert('Key và Value là bắt buộc');
      return;
    }
    try {
      await axios.post(API_BASE, newParam);
      setOpenAddDialog(false);
      setNewParam({
        key: '',
        value: '',
        description: '',
        group: '',
        type: 'string',
        isEditable: true,
      });
      await loadParameters();
      alert('Thêm tham số thành công');
    } catch (error) {
      console.error('Add param error:', error);
      alert('Thêm tham số thất bại');
    }
  }

  // Tập các group có trong parameters để filter select
  const groups = [...new Set(parameters.map((p) => p.group).filter(Boolean))];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        Quản lý Tham số hệ thống
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Nhóm tham số</InputLabel>
          <Select
            label="Nhóm tham số"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {groups.map((g) => (
              <MenuItem key={g} value={g}>
                {g}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={() => setOpenAddDialog(true)}>
          Thêm tham số mới
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Nhóm</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Giá trị</TableCell>
              <TableCell>Sửa được</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parameters.map((param) => (
              <TableRow key={param.key}>
                <TableCell>{param.key}</TableCell>
                <TableCell>{param.description}</TableCell>
                <TableCell>{param.group}</TableCell>
                <TableCell>{param.type}</TableCell>
                <TableCell>
                  {param.isEditable ? (
                    <TextField
                      size="small"
                      variant="outlined"
                      value={editValues[param.key] ?? param.value}
                      onChange={(e) => handleEditChange(param.key, e.target.value)}
                      type={param.type === 'number' ? 'number' : 'text'}
                    />
                  ) : (
                    <Typography>{param.value}</Typography>
                  )}
                </TableCell>
                <TableCell>{param.isEditable ? 'Có' : 'Không'}</TableCell>
                <TableCell>
                  {param.isEditable && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => updateParameter(param.key)}
                      disabled={loading}
                    >
                      Cập nhật
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {parameters.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Không có tham số nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Dialog thêm tham số mới */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thêm tham số mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Key"
            required
            value={newParam.key}
            onChange={(e) => handleNewParamChange('key', e.target.value)}
          />
          <TextField
            label="Giá trị"
            required
            value={newParam.value}
            onChange={(e) => handleNewParamChange('value', e.target.value)}
          />
          <TextField
            label="Mô tả"
            value={newParam.description}
            onChange={(e) => handleNewParamChange('description', e.target.value)}
          />
          <TextField
            label="Nhóm"
            value={newParam.group}
            onChange={(e) => handleNewParamChange('group', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel>Loại</InputLabel>
            <Select
              label="Loại"
              value={newParam.type}
              onChange={(e) => handleNewParamChange('type', e.target.value)}
            >
              <MenuItem value="string">Chuỗi</MenuItem>
              <MenuItem value="number">Số</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={newParam.isEditable}
                onChange={(e) => handleNewParamChange('isEditable', e.target.checked)}
              />
            }
            label="Có thể chỉnh sửa"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={addParameter}>
            Thêm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
