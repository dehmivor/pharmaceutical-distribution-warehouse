'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

import { useForm } from 'react-hook-form';
import { passwordSchema } from '@/utils/validationSchema';
import Copyright from '@/sections/auth/Copyright';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  const password = watch('password');
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Kiểm tra tính hợp lệ của token khi component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        setMessage('Invalid or missing reset token.');
        return;
      }

      try {
        const response = await fetch(`${backendUrl}/api/auth/verify-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ token })
        });

        const result = await response.json();

        if (result.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setMessage(result.message || 'Invalid or expired reset token.');
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setTokenValid(false);
        setMessage('Unable to verify reset token. Please try again.');
      }
    };

    verifyToken();
  }, [token, backendUrl]);

  const onSubmit = async (formData) => {
    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');

      const response = await fetch(`${backendUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: formData.password
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        setMessage('Password has been reset successfully!');
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } else {
        setMessage(result.message || 'Failed to reset password. Please try again.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state khi đang verify token
  if (tokenValid === null) {
    return (
      <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Verifying reset token...
        </Typography>
      </Stack>
    );
  }

  // Token không hợp lệ
  if (tokenValid === false) {
    return (
      <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <Alert severity="error" sx={{ maxWidth: 458 }}>
          {message}
        </Alert>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push('/auth/forgot-password')}>
            Request New Reset Link
          </Button>
          <Button variant="contained" onClick={() => router.push('/auth/login')}>
            Back to Login
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack sx={{ height: 1, alignItems: 'center', justifyContent: 'space-between', gap: 3 }}>
      <Box sx={{ width: 1, maxWidth: 458 }}>
        <Stack sx={{ gap: { xs: 1, sm: 1.5 }, textAlign: 'center', mb: { xs: 3, sm: 8 } }}>
          <Typography variant="h1">Reset Password</Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your new password below.
          </Typography>
        </Stack>

        {!isSuccess ? (
          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <Stack spacing={2.5}>
              <Box>
                <InputLabel>New Password</InputLabel>
                <OutlinedInput
                  {...register('password', passwordSchema)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  fullWidth
                  error={Boolean(errors.password)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.password?.message && <FormHelperText error>{errors.password?.message}</FormHelperText>}
              </Box>

              <Box>
                <InputLabel>Confirm Password</InputLabel>
                <OutlinedInput
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  fullWidth
                  error={Boolean(errors.confirmPassword)}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                        {showConfirmPassword ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                      </IconButton>
                    </InputAdornment>
                  }
                />
                {errors.confirmPassword?.message && <FormHelperText error>{errors.confirmPassword?.message}</FormHelperText>}
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={isLoading}
                endIcon={isLoading && <CircularProgress color="inherit" size={16} />}
                sx={{ mt: 3 }}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Stack>
          </form>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Redirecting to sign in page in 3 seconds...
            </Typography>
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
