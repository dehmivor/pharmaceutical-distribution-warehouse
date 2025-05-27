'use client';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

// @project
import ResponsiveDrawer from './ResponsiveDrawer';

import SimpleBar from '@/components/third-party/SimpleBar';
import { MINI_DRAWER_WIDTH } from '@/config';
import { useGetMenuMaster } from '@/states/menu';

/***************************  DRAWER - CONTENT  ***************************/

export default function DrawerContent() {
  const upMD = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const contentHeight = `calc(100vh - ${MINI_DRAWER_WIDTH}px)`;

  return (
    <SimpleBar sx={{ height: contentHeight }}>
      <Stack sx={{ minHeight: contentHeight, px: !drawerOpen && upMD ? 0 : 2, justifyContent: 'space-between' }}>
        <ResponsiveDrawer />
      </Stack>
    </SimpleBar>
  );
}
