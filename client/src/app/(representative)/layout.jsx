'use client';

import { Box, Container } from '@mui/material';

export default function Layout({ children }) {
  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
      <Container maxWidth="lg">
        {children}
      </Container>
    </Box>
  );
} 