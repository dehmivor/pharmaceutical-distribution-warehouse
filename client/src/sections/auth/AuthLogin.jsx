'use client';
import { useRole } from '@/contexts/RoleContext';
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
import Typography from '@mui/material/Typography';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function AuthLogin({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { updateUserRole } = useRole();

  // Thêm state cho 2-step login
  const [loginStep, setLoginStep] = useState('credentials'); // 'credentials' | 'otp'
  const [tempToken, setTempToken] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Bước 1: Xác thực email/password
  const handleStep1 = async (formData) => {
    try {
      setIsProcessing(true);
      setLoginError('');

      const response = await fetch(`${backendUrl}/api/auth/login/step1`, {
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
        setTempToken(result.data.tempToken);
        setUserEmail(result.data.email);
        setLoginStep('otp');
        reset(); // Clear form
      } else {
        setLoginError(result.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Login step 1 error:', error);
      setLoginError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      setIsVerifying(false);
    }
  };

  // Bước 2: Xác thực OTP
  const handleStep2 = async (formData) => {
    try {
      setIsVerifying(true);
      setIsProcessing(true);
      setLoginError('');

      const response = await fetch(`${backendUrl}/api/auth/login/step2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tempToken: tempToken,
          otp: formData.otp
        })
      });

      const result = await response.json();

      if (result.success) {
        // Store token
        localStorage.setItem('auth-token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));

        // Update role context
        updateUserRole(result.data.user);

        // Redirect
        const redirectUrl = result.data.redirectUrl || '/dashboard';
        router.push(redirectUrl);
      } else {
        setLoginError(result.message || 'OTP không hợp lệ. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Login step 2 error:', error);
      setLoginError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = loginStep === 'credentials' ? handleStep1 : handleStep2;

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  // Nút quay lại bước 1
  const handleBackToStep1 = () => {
    setLoginStep('credentials');
    setTempToken('');
    setUserEmail('');
    setLoginError('');
    setIsVerifying(false);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Grid container rowSpacing={2.5} columnSpacing={1.5}>
        {loginStep === 'credentials' ? (
          <>
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
          </>
        ) : (
          <>
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                OTP code has been sent to email: <strong>{userEmail}</strong>
              </Typography>
              <InputLabel>Mã OTP</InputLabel>
              <OutlinedInput
                {...register('otp', {
                  required: 'Vui lòng nhập mã OTP',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'OTP phải là 6 chữ số'
                  }
                })}
                placeholder="Nhập 6 chữ số"
                fullWidth
                error={Boolean(errors.otp)}
                sx={{ ...inputSx, mt: 2, width: '80%' }}
                inputProps={{ maxLength: 6 }}
              />
              {errors.otp?.message && <FormHelperText error>{errors.otp?.message}</FormHelperText>}
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 3 }}>
        {loginStep === 'otp' && (
          <Grid size={5}>
            <Button variant="outlined" onClick={handleBackToStep1} disabled={isProcessing} fullWidth>
              Back to login
            </Button>
          </Grid>
        )}
        <Grid size={loginStep === 'otp' ? 3 : 5}>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={isProcessing || isVerifying}
            endIcon={(isProcessing || isVerifying) && <CircularProgress color="secondary" size={16} />}
            fullWidth
            sx={{ minWidth: 100 }}
          >
            {isVerifying
              ? 'Verifying...'
              : isProcessing
                ? loginStep === 'credentials'
                  ? 'Sending OTP...'
                  : 'Authenitcating...'
                : loginStep === 'credentials'
                  ? 'Send OTP'
                  : 'Verify OTP'}
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
