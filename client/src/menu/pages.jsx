/***************************  MENU ITEMS - PAGES  ***************************/

const pages = {
  id: 'group-pages',
  title: 'Data & Reports',
  icon: 'IconChartBar',
  url: '/data&reports',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/data&reports/dashboard',
      icon: 'IconLayoutDashboard'
    },
    {
      id: 'reports',
      title: 'Reports',
      type: 'collapse',
      icon: 'IconFileAnalytics',
      children: [
        {
          id: 'report-bills',
          title: 'Bills',
          type: 'item',
          url: '/data&reports/reports/bills'
        },
        {
          id: 'report-imports',
          title: 'Imports & Exports',
          type: 'item',
          url: '/data&reports/reports/imports'
        }
      ]
    },
    {
      id: 'data-tracking',
      title: 'Data Tracking',
      type: 'collapse',
      icon: 'IconTrendingUp',
      children: [
        {
          id: 'tracking-trends',
          title: 'Trends',
          type: 'item',
          url: '/data&reports/data-tracking/trends'
        },
        {
          id: 'tracking-alerts',
          title: 'Alerts',
          type: 'item',
          url: '/data&reports/data-tracking/alerts'
        }
      ]
    }
  ]
};

export default pages;
