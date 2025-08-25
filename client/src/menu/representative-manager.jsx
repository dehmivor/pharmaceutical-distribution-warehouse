const representativeManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/rm-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'manage-import-orders-approval',
      title: 'Import Orders Approval',
      type: 'item',
      url: '/rm-import-orders-approval',
      icon: 'IconFileImport'
    },
    {
      id: 'rm-export-orders-approval',
      title: 'Export Orders Approval',
      type: 'item',
      url: '/rm-export-orders-approval',
      icon: 'IconFileExport'
    },
    {
      id: 'rm-manage-contracts',
      title: 'Manage Contracts',
      type: 'item',
      url: '/rm-manage-contracts',
      icon: 'IconFileInvoice'
    },
    {
      id: 'rm-medicine-performance',
      title: 'Medicine Performance',
      type: 'item',
      url: '/rm-medicine-performance',
      icon: 'IconChartHistogram'
    }
  ]
};

// Function for internationalization (optional use)
export const getRepresentativeManagerMenu = (trans) => ({
  id: 'group-manage',
  title: trans?.common?.manage || 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: trans?.common?.representativeManagerDashboard || 'Dashboard',
      type: 'item',
      url: '/rm-dashboard',
      icon: 'IconDashboard'
    },
    {
      id: 'manage-import-orders-approval',
      title: trans?.common?.importOrdersApproval || 'Import Orders Approval',
      type: 'item',
      url: '/manage-import-orders-approval',
      icon: 'IconFileImport'
    },
    {
      id: 'rm-export-orders-approval',
      title: trans?.common?.exportOrdersApproval || 'Export Orders Approval',
      type: 'item',
      url: '/rm-export-orders-approval',
      icon: 'IconFileExport'
    },
    {
      id: 'rm-manage-contracts',
      title: trans?.common?.manageContracts || 'Manage Contracts',
      type: 'item',
      url: '/rm-manage-contracts',
      icon: 'IconFileInvoice'
    },
    {
      id: 'rm-medicine-performance',
      title: trans?.common?.medicinePerformance || 'Medicine Performance',
      type: 'item',
      url: '/rm-medicine-performance',
      icon: 'IconChartHistogram'
    }
  ]
});

export default representativeManager;
