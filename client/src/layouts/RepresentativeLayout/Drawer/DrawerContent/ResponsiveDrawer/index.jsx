// @mui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';

// @project
import menuItems from '@/menu';
import NavGroup from './NavGroup';

/***************************  DRAWER CONTENT - RESPONSIVE DRAWER  ***************************/

export default function ResponsiveDrawer() {
  const pathname = usePathname();
  const navGroups = menuItems.representative.map((item, index) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={index} item={item} pathname={pathname} />;
      default:
        return (
          <Typography key={index} variant="h6" color="error" align="center">
            Fix - Navigation Group
          </Typography>
        );
    }
  });

  return <Box sx={{ py: 1, transition: 'all 0.3s ease-in-out' }}>{navGroups}</Box>;
}
