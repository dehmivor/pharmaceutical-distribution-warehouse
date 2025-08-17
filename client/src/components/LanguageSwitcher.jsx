'use client';
import { useState } from 'react';
import { Box, Button, Menu, MenuItem, Typography } from '@mui/material';
import { IconLanguage } from '@tabler/icons-react';
import useConfig from '@/hooks/useConfig';
import { ThemeI18n } from '@/config';

export default function LanguageSwitcher() {
  const { i18n, setI18n } = useConfig();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage) => {
    setI18n(newLanguage);
    handleClose();
  };

  const getCurrentLanguageName = () => {
    return i18n === ThemeI18n.VN ? 'Tiếng Việt' : 'English';
  };

  return (
    <Box>
      <Button onClick={handleClick} startIcon={<IconLanguage size={20} />} variant="outlined" size="small" sx={{ minWidth: 'auto', px: 2 }}>
        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {getCurrentLanguageName()}
        </Typography>
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem onClick={() => handleLanguageChange(ThemeI18n.EN)} selected={i18n === ThemeI18n.EN}>
          🇺🇸 English
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange(ThemeI18n.VN)} selected={i18n === ThemeI18n.VN}>
          🇻🇳 Tiếng Việt
        </MenuItem>
      </Menu>
    </Box>
  );
}
