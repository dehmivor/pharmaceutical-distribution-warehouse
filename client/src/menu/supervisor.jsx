/***************************  MENU ITEMS - APPLICATIONS  ***************************/

const supervisor = {
  id: 'group-manage',
  title: 'Manage',
  icon: 'IconBrandAsana',
  type: 'group',
  children: [
    {
      id: 'manage-users',
      title: 'Manage Users',
      type: 'item',
      url: '/manage-users',
      icon: 'IconLayoutGrid'
    }
  ]
};

export default supervisor;
