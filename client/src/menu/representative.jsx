// Static menu object for backward compatibility
const representative = {
  id: 'group-representative',
  title: 'Representative',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'rp-dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/rp-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'rp-manage-contracts',
      title: 'Manage Contracts',
      type: 'item',
      url: '/rp-manage-contracts',
      icon: 'IconFileInvoice'
    },
    
    {
      id: 'rp-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/rp-import-orders',
      icon: 'IconShoppingCart'
    },
    {
      id: 'rp-export-orders',
      title: 'Manage Export Orders',
      type: 'item',
      url: '/rp-export-orders',
      icon: 'IconFileExport'
    },
    {
      id: 'rm-medicine-performance',
      title: 'Medicine performance',
      type: 'item',
      url: '/rp-medicine-performance',
      icon: 'IconChartHistogram'
    }
   
  ]
};

// Function for internationalization (optional use)
export const getRepresentativeMenu = (trans) => ({
  id: 'group-representative',
  title: trans?.common?.representative || 'Representative',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'rp-dashboard',
      title: trans?.common?.dashboard || 'Dashboard',
      type: 'item',
      url: '/rp-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'rp-manage-contracts',
      title: trans?.common?.contractManagement || 'Manage Contracts',
      type: 'item',
      url: '/rp-manage-contracts',
      icon: 'IconFileInvoice'
    },
    
    {
      id: 'rp-import-orders',
      title: trans?.common?.manageImportOrders || 'Manage Import Orders',
      type: 'item',
      url: '/rp-import-orders',
      icon: 'IconShoppingCart'
    },
    {
      id: 'rp-export-orders',
      title: trans?.common?.manageExportOrders || 'Manage Export Orders',
      type: 'item',
      url: '/rp-export-orders',
      icon: 'IconFileExport'
    }
   
  ]
});

export default representative;
