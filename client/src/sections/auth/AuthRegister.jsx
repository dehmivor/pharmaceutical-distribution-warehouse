'use client';
import PropTypes from 'prop-types';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import { useTheme } from '@mui/material/styles';

import { useForm } from 'react-hook-form';

import { emailSchema, firstNameSchema, lastNameSchema, passwordSchema } from '@/utils/validationSchema';

import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function AuthRegister({ inputSx }) {
  const router = useRouter();

  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({ defaultValues: { dialcode: '+1' } });

  const password = useRef({});
  password.current = watch('password', '');

  const onSubmit = async (formData) => {
    try {
      setIsProcessing(true);
      setRegisterError('');

      const userData = {
        fullName: `${formData.firstname} ${formData.lastname}`,
        email: formData.email,
        password: formData.password,
        role: 'user'
      };

      // Call the API endpoint instead of authService
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const result = await response.json();

      if (response.ok) {
        router.push('/auth/login');
      } else {
        setRegisterError(result.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.message?.includes('Email đã được sử dụng')) {
        setRegisterError('Email đã được sử dụng.');
      } else {
        setRegisterError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const commonIconProps = { size: 16, color: theme.palette.grey[700] };

  return (
    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
      <Grid container rowSpacing={2.5} columnSpacing={1.5}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InputLabel>First Name</InputLabel>
          <OutlinedInput
            {...register('firstname', firstNameSchema)}
            placeholder="Enter first name"
            fullWidth
            error={Boolean(errors.firstname)}
            sx={{ ...inputSx }}
          />
          {errors.firstname?.message && <FormHelperText error>{errors.firstname?.message}</FormHelperText>}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <InputLabel>Last Name</InputLabel>
          <OutlinedInput
            {...register('lastname', lastNameSchema)}
            placeholder="Enter last name"
            fullWidth
            error={Boolean(errors.lastname)}
            sx={{ ...inputSx }}
          />
          {errors.lastname?.message && <FormHelperText error>{errors.lastname?.message}</FormHelperText>}
        </Grid>
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
            autoComplete="new-password"
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
        <Grid size={12}>
          <InputLabel>Confirm Password</InputLabel>
          <OutlinedInput
            {...register('confirmPassword', { validate: (value) => value === password.current || 'The passwords do not match' })}
            type={isConfirmOpen ? 'text' : 'password'}
            placeholder="Enter confirm password"
            fullWidth
            error={Boolean(errors.confirmPassword)}
            endAdornment={
              <InputAdornment
                position="end"
                sx={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
                onClick={() => setIsConfirmOpen(!isConfirmOpen)}
              >
                {isConfirmOpen ? <IconEye {...commonIconProps} /> : <IconEyeOff {...commonIconProps} />}
              </InputAdornment>
            }
            sx={inputSx}
          />
          {errors.confirmPassword?.message && <FormHelperText error>{errors.confirmPassword?.message}</FormHelperText>}
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
        Sign Up
      </Button>
      {registerError && (
        <Alert sx={{ mt: 2 }} severity="error" variant="filled" icon={false}>
          {registerError}
        </Alert>
      )}
    </form>
  );
}

AuthRegister.propTypes = { inputSx: PropTypes.any };
