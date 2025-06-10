'use client';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useForm } from 'react-hook-form';
import { emailSchema, passwordSchema } from '@/utils/validationSchema';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

// Import context nếu có
// import { useAuth } from '@/contexts/AuthContext';

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState('');

  // const { login } = useAuth(); // Nếu dùng context

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Trong AuthLogin component, sửa onSubmit:
  const onSubmit = async (formData) => {
    try {
      setIsProcessing(true);
      setLoginError('');

      // ✅ Sử dụng backend URL
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store token
        localStorage.setItem('auth-token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        // Use redirectUrl from backend
        const redirectUrl = result.data.redirectUrl || '/dashboard';
        router.push(redirectUrl);
      } else {
        setLoginError(result.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Grid container rowSpacing={2.5} columnSpacing={1.5}>
        <Grid size={12}>
          <InputLabel>Email</InputLabel>
          <OutlinedInput
            {...register('email', emailSchema)}
            placeholder="example@saasable.io"
            fullWidth
            error={Boolean(errors.email)}
            sx={{ ...inputSx }}
          />
          {errors.email?.message && <FormHelperText error>{errors.email?.message}</FormHelperText>}
        </Grid>

        <Grid size={12}>
          <InputLabel>Password</InputLabel>
          <OutlinedInput
            {...register('password', passwordSchema)}
            type={isOpen ? 'text' : 'password'}
            placeholder="Enter password"
            fullWidth
            error={Boolean(errors.password)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.password?.message && <FormHelperText error>{errors.password?.message}</FormHelperText>}
        </Grid>
      </Grid>

      <Button
        type="submit"
        color="primary"
        variant="contained"
        disabled={isProcessing}
        endIcon={isProcessing && <CircularProgress color="secondary" size={16} />}
        sx={{ minWidth: 120, mt: { xs: 2, sm: 4 }, '& .MuiButton-endIcon': { ml: 1 } }}
      >
        Đăng nhập
      </Button>

      {loginError && (
        <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
          {loginError}
        </Alert>
      )}
    </form>
  );
}

AuthLogin.propTypes = { inputSx: PropTypes.any };
