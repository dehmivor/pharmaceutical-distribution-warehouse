const warehouseManager = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',  
  type: 'group',
  children: [
    {
      id: 'manage-import-orders',
      title: 'Import Orders Management',
      type: 'item',
      url: '/rm-create-bills',
      icon: 'IconFileImport' 
    }
  ]
};

export default warehouseManager;
