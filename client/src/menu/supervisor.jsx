/***************************  MENU ITEMS - APPLICATIONS  ***************************/

const supervisor = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-user',
      title: 'Manage Users',
      type: 'item',
      url: '/manage-user',
      icon: 'IconLayoutGrid'
    },
    {
      id: 'manage-import-orders',
      title: 'Manage Import Orders',
      type: 'item',
      url: '/manage-import-order',
      icon: 'IconFileImport'
    },
    {
      id: 'manage-stock',
      title: 'Manage Stock',
      type: 'item',
      url: '/manage-stock',
      icon: 'IconBoxMultiple'
    }
  ]
};

export default supervisor;
