import React from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

const licenses = [
  {
    id: 1,
    supplier: 'Công ty Dược ABC',
    licenseNumber: 'GCN-001',
    issueDate: '2023-01-15',
    expiryDate: '2026-01-15',
    status: 'Còn hiệu lực',
  },
  {
    id: 2,
    supplier: 'Công ty Dược XYZ',
    licenseNumber: 'GCN-002',
    issueDate: '2021-05-10',
    expiryDate: '2024-05-10',
    status: 'Sắp hết hạn',
  },
  {
    id: 3,
    supplier: 'Công ty Dược DEF',
    licenseNumber: 'GCN-003',
    issueDate: '2020-03-20',
    expiryDate: '2023-03-20',
    status: 'Hết hiệu lực',
  },
];

function LicensePage() {
  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Danh sách giấy phép nhà cung cấp
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>STT</TableCell>
              <TableCell>Tên nhà cung cấp</TableCell>
              <TableCell>Số giấy phép</TableCell>
              <TableCell>Ngày cấp</TableCell>
              <TableCell>Ngày hết hạn</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {licenses.map((l, idx) => (
              <TableRow key={l.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{l.supplier}</TableCell>
                <TableCell>{l.licenseNumber}</TableCell>
                <TableCell>{l.issueDate}</TableCell>
                <TableCell>{l.expiryDate}</TableCell>
                <TableCell>{l.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default LicensePage;