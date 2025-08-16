'use client';
import useTrans from '@/hooks/useTrans';
import { Box, Stack, TableContainer, Typography } from '@mui/material';

function HeaderSection() {
  const trans = useTrans();
  return (
    <TableContainer>
      <Typography variant="h4" gutterBottom>
        {trans.header.title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {trans.header.description}
      </Typography>
    </TableContainer>
  );
}

export default HeaderSection;
