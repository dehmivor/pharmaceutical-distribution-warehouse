'use client';
import { useAuth } from '@/hooks/useAuth';
import { emailSchema, passwordSchema } from '@/utils/validationSchema';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useTheme } from '@mui/material/styles';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { login, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const handleLogin = async (formData) => {
    try {
      setLoginError('');

      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect theo role từ backend response
        const redirectUrl = result.data.redirectUrl || '/dashboard';
        router.push(redirectUrl);
      } else {
        setLoginError(result.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setLoginError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <form onSubmit={handleSubmit(handleLogin)} autoComplete="off">
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

      <Grid container sx={{ mt: 3 }}>
        <Grid size={12}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={loading}
            endIcon={loading && <CircularProgress color="secondary" size={16} />}
            sx={{ width: 150 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Grid>
      </Grid>

      {loginError && (
        <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
          {loginError}
        </Alert>
      )}
    </form>
  );
}

AuthLogin.propTypes = { inputSx: PropTypes.any };
