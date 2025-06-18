'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';

// @mui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { useForm } from 'react-hook-form';
import Copyright from '@/sections/auth/Copyright';

export default function ForgotPassword() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const onSubmit = async (formData) => {
    try {
      setIsLoading(true);
      setMessage('');

      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setMessage('Password reset link has been sent to your email address.');
      } else {
        setMessage(result.message || 'Failed to send reset email. Please try again.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">Forgot Password</Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
        </Stack>

        {!isSuccess ? (
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <Stack spacing={2.5}>
              <Box>
                <InputLabel>Email Address</InputLabel>
                <OutlinedInput
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  type="email"
                  placeholder="Enter your email address"
                  fullWidth
                  error={Boolean(errors.email)}
                />
                {errors.email?.message && <FormHelperText error>{errors.email?.message}</FormHelperText>}
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                endIcon={isLoading && <CircularProgress color="inherit" size={16} />}
                sx={{ mt: 3 }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Stack>
          </form>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please check your email and click the link to reset your password.
            </Typography>
            <Button variant="outlined" onClick={() => router.push('/auth/login')}>
              Back to Sign In
            </Button>
          </Box>
        )}

        {message && !isSuccess && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}

        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Link component={NextLink} href="/auth/login" underline="hover" variant="subtitle2">
            Back to Sign In
          </Link>
        </Stack>
      </Box>

      <Copyright />
    </Stack>
  );
}
