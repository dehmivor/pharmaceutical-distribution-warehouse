import useTrans from '@/hooks/useTrans';
import { Box, Typography } from '@mui/material';

const HeaderSection = () => {
  const trans = useTrans();
  return (
    <Box sx={{ p: { xs: 1, md: 3 }, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {trans.header.title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {trans.header.description}
      </Typography>
    </Box>
  );
};

export default HeaderSection;
