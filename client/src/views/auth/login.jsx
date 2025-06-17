// @next
import NextLink from 'next/link';

// @mui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AuthLogin from '@/sections/auth/AuthLogin';
import Copyright from '@/sections/auth/Copyright';

export default function Login() {
  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">Sign In</Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Select the method of login.
          </Typography>
        </Stack>

        <AuthLogin />

        <Stack direction="row" justifyContent="start" alignItems="center" spacing={1} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary">
            Need help?
          </Typography>
          <Link
            component={NextLink}
            underline="hover"
            variant="subtitle2"
            href="/auth/forgot-password"
            sx={{ '&:hover': { color: 'primary.dark' } }}
          >
            Forgot password
          </Link>
          <Typography variant="body2" color="text.secondary">
            |
          </Typography>
          <Link
            component={NextLink}
            underline="hover"
            variant="subtitle2"
            href="/contact-support"
            sx={{ '&:hover': { color: 'primary.dark' } }}
          >
            Contact support
          </Link>
        </Stack>
      </Box>

      <Copyright />
    </Stack>
  );
}
