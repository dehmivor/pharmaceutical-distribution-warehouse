/***************************  MENU ITEMS - PAGES  ***************************/

const pages = {
  id: 'group-pages',
  title: 'Data & Reports',
  icon: 'IconChartBar',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard',
      icon: 'IconLayoutDashboard'
    },
    {
      id: 'reports',
      title: 'Reports',
      type: 'collapse',
      icon: 'IconFileAnalytics',
      children: [
        {
          id: 'report-summary',
          title: 'Weekly',
          type: 'item',
          url: '/reports/weekly'
        },
        {
          id: 'report-detail',
          title: 'Monthly',
          type: 'item',
          url: '/reports/monthly'
        },
        {
          id: 'report-custom',
          title: 'Yearly',
          type: 'item',
          url: '/reports/yearly'
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
          url: '/data-tracking/trends'
        },
        {
          id: 'tracking-alerts',
          title: 'Alerts',
          type: 'item',
          url: '/data-tracking/alerts'
        }
      ]
    }
  ]
};

export default pages;
