'use client';
import { Box, Typography } from '@mui/material';

function HeaderSection() {
  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Manage User
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Administer and oversee user accounts and privileges within the platform
      </Typography>
    </Box>
  );
}

export default HeaderSection;
