'use client';
import useTrans from '@/hooks/useTrans';
import { Box, Typography } from '@mui/material';

function HeaderSection() {
  const trans = useTrans();
  return (
    <div>
      <Box>
        <Typography variant="h4" gutterBottom>
          {trans.header.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: { xs: '100%', md: '600px' } }}>
          {trans.header.description}
        </Typography>
      </Box>
    </div>
  );
}

export default HeaderSection;
