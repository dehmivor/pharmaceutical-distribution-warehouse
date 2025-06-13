/***************************  MENU ITEMS - PAGES  ***************************/

const pages = {
  id: 'group-pages',
  title: 'Data & Reports',
  icon: 'IconChartBar',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Overview',
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
          url: '/reports/summary'
        },
        {
          id: 'report-detail',
          title: 'Monthly',
          type: 'item',
          url: '/reports/detail'
        },
        {
          id: 'report-custom',
          title: 'Yearly',
          type: 'item',
          url: '/reports/custom'
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
          id: 'tracking-overview',
          title: 'Overview',
          type: 'item',
          url: '/data-tracking/overview'
        },
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
