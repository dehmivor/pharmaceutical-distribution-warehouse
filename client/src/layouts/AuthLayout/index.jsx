'use client';
import PropTypes from 'prop-types';

// @mui
import CardMedia from '@mui/material/CardMedia';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import LogoMain from '@/components/logo/LogoMain';
import GetImagePath from '@/utils/GetImagePath';

const dashBoardImage = {
  light: '/assets/images/graphics/hosting/drugs.jpg',
  dark: '/assets/images/graphics/hosting/dashboard-dark.svg'
};

const logoImage = {
  light: '/assets/images/graphics/hosting/logo.png'
};

/***************************  AUTH LAYOUT  ***************************/

export default function AuthLayout({ children }) {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid size={{ xs: 12, md: 4, lg: 6 }} sx={{ p: { xs: 3, sm: 7 } }}>
        {children}
      </Grid>
      <Grid size={{ xs: 12, md: 6, lg: 6 }} sx={{ bgcolor: 'grey.100', display: { xs: 'none', md: 'block' } }}>
        <Stack sx={{ height: 1, justifyContent: 'space-between' }}>
          <Box sx={{ height: 1 }}>
            <CardMedia
              image={GetImagePath(dashBoardImage)}
              sx={{
                height: 1,
                border: '4px solid',
                borderColor: 'grey.300'
              }}
            />
          </Box>
        </Stack>
      </Grid>
    </Grid>
  );
}

AuthLayout.propTypes = { children: PropTypes.any };
