'use client';
import PropTypes from 'prop-types';

// @mui
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';

// @project
import LogoMain from './LogoMain';
import LogoIcon from './LogoIcon';
import { generateFocusStyle } from '@/utils/generateFocusStyle';

/***************************  MAIN - LOGO  ***************************/

export default function LogoSection({ isIcon, sx, to }) {
  const theme = useTheme();
  const router = useRouter();
  const { userRole } = useRole();

  // Map role to home URL
  const getHomeUrl = () => {
    const roleHomeMap = {
      supervisor: '/data&reports/dashboard',
      representative: '/rp-dashboard',
      warehouse: '/wh-dashboard-import',
      warehouse_manager: '/wm-dashboard',
      representative_manager: '/rm-dashboard'
    };
    return roleHomeMap[userRole] || '/';
  };

  const handleLogoClick = () => {
    const homeUrl = to || getHomeUrl();
    router.push(homeUrl);
  };

  return (
    <ButtonBase
      disableRipple
      sx={{
        ...sx,
        '&:focus-visible': generateFocusStyle(theme.palette.primary.main),
        cursor: 'pointer'
      }}
      aria-label="logo"
      onClick={handleLogoClick}
    >
      {isIcon ? <LogoIcon /> : <LogoMain />}
    </ButtonBase>
  );
}

LogoSection.propTypes = { isIcon: PropTypes.bool, sx: PropTypes.any, to: PropTypes.string };
