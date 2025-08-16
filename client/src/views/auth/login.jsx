'use client';
// @next
import NextLink from 'next/link';

// @mui
import useTrans from '@/hooks/useTrans';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AuthLogin from '@/sections/auth/AuthLogin';
import Copyright from '@/sections/auth/Copyright';

export default function Login() {
  const trans = useTrans();

  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">{trans.actions.signIn}</Typography>
          <Typography variant="body1" color="text.secondary">
            {trans.messages.welcomeBack}
          </Typography>
        </Stack>

        <AuthLogin />

        <Stack direction="row" justifyContent="start" alignItems="center" spacing={1} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary">
            {trans.messages.needHelp}
          </Typography>
          <Link
            component={NextLink}
            underline="hover"
            variant="subtitle2"
            href="/auth/forgot-password"
            sx={{ '&:hover': { color: 'primary.dark' } }}
          >
            {trans.actions.forgotPassword}
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
            {trans.actions.contactSupport}
          </Link>
        </Stack>
      </Box>

      <Copyright />
    </Stack>
  );
}
