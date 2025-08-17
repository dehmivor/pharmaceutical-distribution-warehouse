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

  // Get the warehouse manager menu and apply translations
  const warehouseManagerMenu = menuItems.warehouseManager[0]; // Get the first (and only) item

  // Create translated menu items
  const translatedMenu = {
    ...warehouseManagerMenu,
    title: trans?.common?.manage || warehouseManagerMenu.title,
    children: warehouseManagerMenu.children.map((child) => ({
      ...child,
      title: trans?.common?.[getTranslationKey(child.id)] || child.title,
      children: child.children
        ? child.children.map((grandChild) => ({
            ...grandChild,
            title: trans?.common?.[getTranslationKey(grandChild.id)] || grandChild.title
          }))
        : undefined
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
    dashboard: 'dashboard',
    'order-management': 'orderManagement',
    'manage-import-orders': 'importOrdersManagement',
    'manage-export-orders': 'exportOrdersManagement',
    'inventory-management': 'inventoryManagement',
    'view-inventory-check-orders': 'checkOrdersManagement',
    'wm-manage-inventory': 'inventoryDashboard'
  };
  return translationMap[menuId] || menuId;
}
