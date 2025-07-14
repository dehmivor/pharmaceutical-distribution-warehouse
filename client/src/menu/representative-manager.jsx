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
  ]
};

export default representativeManager;
