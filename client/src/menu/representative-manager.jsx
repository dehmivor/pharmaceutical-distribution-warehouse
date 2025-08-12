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
      url: '/manage-import-orders-approval',
      icon: 'IconFileImport'
    },
    {
      id: 'manage-export-orders-approval',
      title: 'Export Orders Approval',
      type: 'item',
      url: '/manage-export-orders-approval',
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
      id: 'rm-handle-bill',
      title: 'Handle Bill',
      type: 'item',
      url: '/rm-handle-bill',
      icon: 'IconList'
    },
    {
      id: 'rm-medicine-performance',
      title: 'Medicine performance',
      type: 'item',
      url: '/rm-medicine-performance',
      icon: 'IconChartHistogram'
    }
  ]
};

export default representativeManager;
