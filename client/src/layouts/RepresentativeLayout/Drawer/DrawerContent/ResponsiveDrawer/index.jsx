// @mui
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { usePathname } from 'next/navigation';

// @project
import menuItems from '@/menu';
import NavGroup from './NavGroup';
import useTrans from '@/hooks/useTrans';

/***************************  DRAWER CONTENT - RESPONSIVE DRAWER  ***************************/

export default function ResponsiveDrawer() {
  const pathname = usePathname();
  const trans = useTrans();
  
  // Get the representative menu and apply translations
  const representativeMenu = menuItems.representative[0]; // Get the first (and only) item
  
  // Create translated menu items
  const translatedMenu = {
    ...representativeMenu,
    title: trans?.common?.representative || representativeMenu.title,
    children: representativeMenu.children.map(child => ({
      ...child,
      title: trans?.common?.[getTranslationKey(child.id)] || child.title
    }))
  };
  
  const navGroups = [translatedMenu].map((item, index) => {
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

// Helper function to map menu IDs to translation keys
function getTranslationKey(menuId) {
  const translationMap = {
    'rp-dashboard': 'dashboard',
    'rp-manage-contracts': 'contractManagement',
    'rp-import-orders': 'manageImportOrders',
    'rp-export-orders': 'manageExportOrders'
  };
  return translationMap[menuId] || menuId;
}
