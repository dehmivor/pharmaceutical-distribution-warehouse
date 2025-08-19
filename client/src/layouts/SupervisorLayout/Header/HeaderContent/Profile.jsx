'use client';

import { useState } from 'react';

// @mui
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Box from '@mui/material/Box';

// @third-party
import { enqueueSnackbar } from 'notistack';

// @project
import { ThemeI18n } from '@/config';
import MainCard from '@/components/MainCard';
import Profile from '@/components/Profile';
import { AvatarSize, ChipIconPosition } from '@/enum';
import useConfig from '@/hooks/useConfig';
import useTrans from '@/hooks/useTrans';

// @assets
import { IconChevronRight, IconLanguage, IconLogout, IconSettings, IconSunMoon, IconQrcode } from '@tabler/icons-react';

// Import hook useRole
import { useRole } from '@/contexts/RoleContext';
import { Typography } from '@mui/material';
import QRScanner from '@/components/QRScanner';

const languageList = [
  { key: ThemeI18n.EN, value: 'English' },
  { key: ThemeI18n.VN, value: 'Vietnam' }
];
// Hàm trả màu theo role (caption)
const getLevelColor = (role) => {
  switch (role) {
    case 'supervisor':
      return 'error';
    case 'representative':
      return 'warning';
    case 'representative_manager':
      return 'primary';
    case 'warehouse':
      return 'info';
    case 'warehouse_manager':
      return 'primary';
    default:
      return 'default';
  }
};

export default function ProfileSection() {
  const theme = useTheme();
  const { i18n, setI18n } = useConfig();
  const { user, userRole, isLoading, updateUserRole } = useRole();
  const trans = useTrans();

  const [anchorEl, setAnchorEl] = useState(null);
  const [innerAnchorEl, setInnerAnchorEl] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const open = Boolean(anchorEl);
  const innerOpen = Boolean(innerAnchorEl);
  const id = open ? 'profile-action-popper' : undefined;
  const innerId = innerOpen ? 'profile-inner-popper' : undefined;
  const buttonStyle = { borderRadius: 2, p: 1 };

  if (isLoading) return null;

  const handleActionClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleInnerActionClick = (event) => {
    setInnerAnchorEl(innerAnchorEl ? null : event.currentTarget);
  };

  const logoutAccount = async () => {
    setAnchorEl(null);
    try {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      localStorage.removeItem('refresh-token');
      enqueueSnackbar('Logout successful', { variant: 'success' });
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
    }
  };

  const i18nHandler = (event, key) => {
    handleInnerActionClick(event);
    if (key !== i18n) {
      setI18n(key);
      enqueueSnackbar(`Language changed to ${languageList.find((l) => l.key === key)?.value}`, { variant: 'success' });
    }
  };

  const handleQRScan = (data) => {
    try {
      // Hiển thị thông báo thành công
      enqueueSnackbar(`QR Code scanned successfully!`, { variant: 'success' });

      // Log dữ liệu để debug
      console.log('QR Code data:', data);

      // Xử lý dữ liệu QR code nhận được
      // Bạn có thể thêm logic xử lý ở đây:
      // - Gửi API để xác thực
      // - Lưu vào state
      // - Chuyển hướng đến trang khác
      // - Hiển thị thông tin chi tiết

      // Ví dụ: Hiển thị dữ liệu trong alert (có thể thay thế bằng modal hoặc component khác)
      if (data && data.length > 0) {
        // Có thể parse JSON nếu QR code chứa JSON data
        try {
          const parsedData = JSON.parse(data);
          console.log('Parsed QR data:', parsedData);
          // Xử lý dữ liệu đã parse
        } catch (parseError) {
          // Nếu không phải JSON, xử lý như string thông thường
          console.log('QR data as string:', data);
        }
      }
    } catch (error) {
      console.error('Error processing QR code data:', error);
      enqueueSnackbar('Error processing QR code data', { variant: 'error' });
    }
  };
  const profileData = {
    title: user?.email || 'User',
    caption: userRole || 'User'
  };

  return (
    <>
      <Box onClick={handleActionClick} sx={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
        <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
          <Profile {...profileData} />
        </Box>
        <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: theme.palette[getLevelColor(profileData.caption)]?.main || 'grey'
            }}
            alt={profileData.title}
          >
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold' }}>
              {(profileData.title && profileData.title.charAt(0).toUpperCase()) || '?'}
            </Typography>
          </Avatar>
        </Box>
      </Box>
      <Popper
        placement="bottom-end"
        id={id}
        open={open}
        anchorEl={anchorEl}
        transition
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [8, 8] } }] }}
      >
        {({ TransitionProps }) => (
          <Fade in={open} {...TransitionProps}>
            <MainCard sx={{ borderRadius: 2, boxShadow: theme.customShadows.tooltip, minWidth: 220, p: 0.5 }}>
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <Stack sx={{ px: 0.5, py: 0.75 }}>
                  <Profile
                    {...profileData}
                    sx={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      width: 1,
                      '& .MuiAvatar-root': { width: 48, height: 48 }
                    }}
                  />
                  <Divider sx={{ my: 1 }} />
                  <List disablePadding>
                    <ListItemButton
                      sx={buttonStyle}
                      onClick={() => {
                        setQrScannerOpen(true);
                        setAnchorEl(null);
                      }}
                    >
                      <ListItemIcon>
                        <IconQrcode size={16} />
                      </ListItemIcon>
                      <ListItemText primary="Scan Mobile Mode" />
                    </ListItemButton>
                    <ListItemButton sx={buttonStyle} onClick={handleInnerActionClick}>
                      <ListItemIcon>
                        <IconLanguage size={16} />
                      </ListItemIcon>
                      <ListItemText primary={trans.header.language || 'Language'} />
                      <Chip
                        label={languageList.find((item) => item.key === i18n)?.value.slice(0, 3)}
                        variant="text"
                        size="small"
                        color="secondary"
                        icon={<IconChevronRight size={16} />}
                        position={ChipIconPosition.RIGHT}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Popper
                        placement="left-start"
                        id={innerId}
                        open={innerOpen}
                        anchorEl={innerAnchorEl}
                        transition
                        popperOptions={{
                          modifiers: [
                            {
                              name: 'preventOverflow',
                              options: {
                                boundary: 'clippingParents'
                              }
                            },
                            { name: 'offset', options: { offset: [0, 8] } }
                          ]
                        }}
                      >
                        {({ TransitionProps }) => (
                          <Fade in={innerOpen} {...TransitionProps}>
                            <MainCard sx={{ borderRadius: 2, boxShadow: theme.customShadows.tooltip, minWidth: 150, p: 0.5 }}>
                              <ClickAwayListener onClickAway={() => setInnerAnchorEl(null)}>
                                <List disablePadding>
                                  {languageList.map((item, index) => (
                                    <ListItemButton
                                      selected={item.key === i18n}
                                      key={index}
                                      sx={buttonStyle}
                                      onClick={(event) => i18nHandler(event, item.key)}
                                    >
                                      <ListItemText>{item.value}</ListItemText>
                                    </ListItemButton>
                                  ))}
                                </List>
                              </ClickAwayListener>
                            </MainCard>
                          </Fade>
                        )}
                      </Popper>
                    </ListItemButton>
                    <ListItemButton href="#" sx={{ ...buttonStyle, my: 0.5 }}>
                      <ListItemIcon>
                        <IconSettings size={16} />
                      </ListItemIcon>
                      <ListItemText primary={trans.header.settings || 'Settings'} />
                    </ListItemButton>
                    <ListItem disablePadding>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="secondary"
                        size="small"
                        endIcon={<IconLogout size={16} />}
                        onClick={logoutAccount}
                      >
                        {trans.header.logout || 'Logout'}
                      </Button>
                    </ListItem>
                  </List>
                </Stack>
              </ClickAwayListener>
            </MainCard>
          </Fade>
        )}
      </Popper>

      <QRScanner open={qrScannerOpen} onClose={() => setQrScannerOpen(false)} onScan={handleQRScan} title="Scan QR Code - Mobile Mode" />
    </>
  );
}
