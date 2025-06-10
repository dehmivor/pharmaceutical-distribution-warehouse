'use client';
import React from 'react';
import { Container, Typography } from '@mui/material';

export default function CycleCountPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1">
        Quản lý đợt kiểm kê
      </Typography>
    </Container>
  );
}