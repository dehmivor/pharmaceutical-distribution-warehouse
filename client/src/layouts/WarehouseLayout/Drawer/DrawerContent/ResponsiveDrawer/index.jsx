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

  // Get the warehouse menu and apply translations
  const warehouseMenu = menuItems.warehouse[0]; // Get the first (and only) item

  // Create translated menu items
  const translatedMenu = {
    ...warehouseMenu,
    title: trans?.common?.warehouseManagement || warehouseMenu.title,
    children: warehouseMenu.children.map((child) => ({
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
    'warehouse-dashboard': 'warehouseDashboard',
    'import-orders': 'import',
    'view-import-orders': 'importOrdersList',
    inventory: 'inventory',
    'view-inventory-check-orders': 'viewInventoryCheckOrders',
    'export-orders': 'export',
    'view-export-orders': 'exportOrdersList',
    management: 'management',
    'manage-locations': 'locationManagement',
    'view-packages': 'packageManagement'
  };
  return translationMap[menuId] || menuId;
}
