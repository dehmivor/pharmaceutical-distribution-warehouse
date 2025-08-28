'use client';
import { useAuth } from '@/hooks/useAuth';
import { emailSchema } from '@/utils/validationSchema';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ActiveAccount({ inputSx }) {
  const router = useRouter();
  const theme = useTheme();
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isConfirmPasswordOpen, setIsConfirmPasswordOpen] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { activateAccount, loading } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm();

  // Watch password để validate confirm password[2]
  const watchPassword = watch('newPassword', '');

  // Custom validation schemas
  const newPasswordSchema = {
    required: 'Mật khẩu mới là bắt buộc',
    minLength: {
      value: 6,
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    },
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    }
  };

  const confirmPasswordSchema = {
    required: 'Xác nhận mật khẩu là bắt buộc',
    validate: (value) => {
      if (value !== watchPassword) {
        return 'Mật khẩu xác nhận không khớp';
      }
      return true;
    }
  };

  const otpSchema = {
    required: 'Mã OTP là bắt buộc',
    pattern: {
      value: /^\d{6}$/,
      message: 'Mã OTP phải là 6 chữ số'
    }
  };

  const handleActivation = async (formData) => {
    try {
      setActivationError('');
      setSuccessMessage('');

      const result = await activateAccount({
        email: formData.email,
        newPassword: formData.newPassword,
        otp: formData.otp
      });

      if (result.success) {
        setSuccessMessage('Kích hoạt tài khoản thành công! Đang chuyển hướng...');

        // Redirect sau 2 giây
        setTimeout(() => {
          const redirectUrl = result.data.redirectUrl || '/auth/login';
          router.push(redirectUrl);
        }, 2000);
      } else {
        setActivationError(result.message || 'Kích hoạt tài khoản thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setActivationError(error.message || 'Kích hoạt tài khoản thất bại. Vui lòng thử lại.');
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <form onSubmit={handleSubmit(handleActivation)} autoComplete="off">
      <Grid container rowSpacing={2.5} columnSpacing={1.5}>
        {/* Email Field */}
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

        {/* OTP Field */}
        <Grid size={12}>
          <InputLabel>Mã OTP</InputLabel>
          <OutlinedInput
            {...register('otp', otpSchema)}
            placeholder="Nhập mã OTP 6 chữ số"
            fullWidth
            error={Boolean(errors.otp)}
            inputProps={{ maxLength: 6 }}
            sx={{ ...inputSx }}
          />
          {errors.otp?.message && <FormHelperText error>{errors.otp?.message}</FormHelperText>}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Mã OTP đã được gửi đến email của bạn
          </Typography>
        </Grid>

        {/* New Password Field */}
        <Grid size={12}>
          <InputLabel>Mật khẩu mới</InputLabel>
          <OutlinedInput
            {...register('newPassword', newPasswordSchema)}
            type={isPasswordOpen ? 'text' : 'password'}
            placeholder="Nhập mật khẩu mới"
            fullWidth
            error={Boolean(errors.newPassword)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setIsPasswordOpen(!isPasswordOpen)}
              >
                {isPasswordOpen ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.newPassword?.message && <FormHelperText error>{errors.newPassword?.message}</FormHelperText>}
        </Grid>

        {/* Confirm Password Field */}
        <Grid size={12}>
          <InputLabel>Xác nhận mật khẩu</InputLabel>
          <OutlinedInput
            {...register('confirmPassword', confirmPasswordSchema)}
            type={isConfirmPasswordOpen ? 'text' : 'password'}
            placeholder="Nhập lại mật khẩu mới"
            fullWidth
            error={Boolean(errors.confirmPassword)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setIsConfirmPasswordOpen(!isConfirmPasswordOpen)}
              >
                {isConfirmPasswordOpen ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
              </InputAdornment>
            }
            sx={inputSx}
            onPaste={(e) => {
              // Prevent paste trong confirm password field[4]
              e.preventDefault();
              return false;
            }}
          />
          {errors.confirmPassword?.message && <FormHelperText error>{errors.confirmPassword?.message}</FormHelperText>}
        </Grid>

        {/* Information Alert */}
        <Grid size={12}>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              📧 Hướng dẫn kích hoạt tài khoản:
            </Typography>
            <Typography variant="body2" component="div">
              • Nhập email bạn đã đăng ký
              <br />
              • Nhập mã OTP được gửi đến email
              <br />
              • Tạo mật khẩu mới cho tài khoản
              <br />• Mã OTP có hiệu lực trong 24 giờ
            </Typography>
          </Alert>
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
            sx={{ width: 200 }}
          >
            {loading ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
          </Button>
        </Grid>
      </Grid>

      {/* Success Message */}
      {successMessage && (
        <Alert sx={{ mt: 2 }} severity="success" variant="filled">
          {successMessage}
        </Alert>
      )}

      {/* Error Message */}
      {activationError && (
        <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
          {activationError}
        </Alert>
      )}
    </form>
  );
}

ActiveAccount.propTypes = { inputSx: PropTypes.any };
