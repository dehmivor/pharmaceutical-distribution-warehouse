// @mui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// @project
import menuItems from '@/menu';
import NavGroup from './NavGroup';
import useTrans from '@/hooks/useTrans';

/***************************  DRAWER CONTENT - RESPONSIVE DRAWER  ***************************/

export default function ResponsiveDrawer() {
  const trans = useTrans();

  // Get the representative manager menu and apply translations
  const representativeManagerMenu = menuItems.representativeManager[0]; // Get the first (and only) item

  // Create translated menu items
  const translatedMenu = {
    ...representativeManagerMenu,
    title: trans?.common?.representativeManager || representativeManagerMenu.title,
    children: representativeManagerMenu.children.map((child) => ({
      ...child,
      title: trans?.common?.[getTranslationKey(child.id)] || child.title
    }))
  };

  const navGroups = [translatedMenu].map((item, index) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={index} item={item} />;
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

// Helper function to map menu IDs to translation keys
function getTranslationKey(menuId) {
  const translationMap = {
    dashboard: 'representativeManagerDashboard',
    'manage-import-orders-approval': 'importOrdersApproval',
    'manage-export-orders-approval': 'exportOrdersApproval',
    'rm-manage-contracts': 'manageContracts',
    'rm-medicine-performance': 'medicinePerformance'
  };
  return translationMap[menuId] || menuId;
}
