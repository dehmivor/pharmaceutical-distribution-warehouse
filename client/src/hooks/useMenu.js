import { useMemo } from 'react';
import useTrans from './useTrans';

export default function useMenu() {
  const trans = useTrans();

  const supervisorMenu = useMemo(
    () => [
      {
        id: 'group-supervisor',
        title: trans.menu.manage || 'Manage',
        icon: 'IconBrandAsana',
        type: 'group',
        children: [
          {
            id: 'manage-users',
            title: trans.menu.manageUsers || 'Manage Users',
            type: 'item',
            url: '/sp-manage-users',
            icon: 'IconUser'
          },
          {
            id: 'order-management',
            title: trans.menu.orderManagement || 'Order Management',
            type: 'collapse',
            url: '/order-management',
            icon: 'IconDatabaseExport',
            children: [
              {
                id: 'manage-import-orders',
                title: trans.menu.importOrders || 'Import Orders',
                type: 'item',
                url: '/sp-import-orders',
                icon: 'IconFileImport'
              },
              {
                id: 'manage-export-orders',
                title: trans.menu.exportOrders || 'Export Orders',
                type: 'item',
                url: '/sp-export-orders',
                icon: 'IconFileExport'
              }
            ]
          },
          {
            id: 'manage-medicines',
            title: trans.menu.manageMedicines || 'Manage Medicines',
            type: 'item',
            url: '/sp-manage-medicines',
            icon: 'IconPill'
          },
          {
            id: 'bill-management',
            title: trans.menu.billManagement || 'Bill Management',
            type: 'collapse',
            url: '/bill-management',
            icon: 'IconReceipt',
            children: [
              {
                id: 'pay-bills',
                title: trans.menu.payBills || 'Pay Bills',
                type: 'item',
                url: '/sp-manage-bills'
              },
              {
                id: 'sp-reports-bills',
                title: trans.menu.reportBills || 'Report Bills',
                type: 'item',
                url: '/sp-report'
              }
            ]
          },
          {
            id: 'inventory-management',
            title: trans.menu.inventoryManagement || 'Inventory Management',
            type: 'collapse',
            url: '/inventory-management',
            icon: 'IconClipboardCheck',
            children: [
              {
                id: 'inventory-check-management',
                title: trans.menu.inventoryCheckOrders || 'Inventory Check Orders',
                type: 'item',
                url: '/sp-inventory-check-management',
                icon: 'IconClipboardCheck'
              },
              {
                id: 'manage-packages',
                title: trans.menu.managePackages || 'Manage Packages',
                type: 'item',
                url: '/sp-manage-packages',
                icon: 'IconPackage'
              }
            ]
          },
          {
            id: 'location-management',
            title: trans.menu.locationManagement || 'Location Management',
            type: 'collapse',
            url: '/location-management',
            icon: 'IconMapPin',
            children: [
              {
                id: 'manage-areas',
                title: trans.menu.manageAreas || 'Manage Areas',
                type: 'item',
                url: '/sp-area-management',
                icon: 'IconMapPin'
              },
              {
                id: 'manage-locations',
                title: trans.menu.manageLocations || 'Manage Locations',
                type: 'item',
                url: '/sp-location-management',
                icon: 'IconMapPin'
              }
            ]
          },
          {
            id: 'contract-management',
            title: trans.menu.contractManagement || 'Contract Management',
            type: 'collapse',
            url: '/contract-management',
            icon: 'IconContract',
            children: [
              {
                id: 'retailer-management',
                title: trans.menu.retailerManagement || 'Retailer Management',
                type: 'item',
                url: '/sp-retailer-contracts',
                icon: 'IconBuildingStore'
              },
              {
                id: 'supplier-management',
                title: trans.menu.supplierManagement || 'Supplier Management',
                type: 'item',
                url: '/sp-supplier-contracts',
                icon: 'IconTruck'
              }
            ]
          },
          {
            id: 'log-management',
            title: trans.menu.logManagement || 'Log Management',
            type: 'item',
            url: '/sp-location-log',
            icon: 'IconTimelineEventText'
          }
        ]
      }
    ],
    [trans]
  );

  const dataReportsMenu = useMemo(
    () => [
      {
        id: 'group-pages',
        title: trans.menu.dataReports || 'Data & Reports',
        icon: 'IconChartBar',
        url: '/data&reports',
        type: 'group',
        children: [
          {
            id: 'dashboard',
            title: trans.menu.dashboard || 'Dashboard',
            type: 'item',
            url: '/data&reports/dashboard',
            icon: 'IconLayoutDashboard'
          },
          {
            id: 'reports',
            title: trans.menu.reports || 'Reports',
            type: 'collapse',
            icon: 'IconFileAnalytics',
            children: [
              {
                id: 'report-summary',
                title: trans.menu.weekly || 'Weekly',
                type: 'item',
                url: '/data&reports/reports/weekly'
              },
              {
                id: 'report-detail',
                title: trans.menu.monthly || 'Monthly',
                type: 'item',
                url: '/data&reports/reports/monthly'
              },
              {
                id: 'report-custom',
                title: trans.menu.yearly || 'Yearly',
                type: 'item',
                url: '/data&reports/reports/yearly'
              }
            ]
          },
          {
            id: 'data-tracking',
            title: trans.menu.dataTracking || 'Data Tracking',
            type: 'collapse',
            icon: 'IconTrendingUp',
            children: [
              {
                id: 'tracking-trends',
                title: trans.menu.trends || 'Trends',
                type: 'item',
                url: '/data&reports/data-tracking/trends'
              },
              {
                id: 'tracking-alerts',
                title: trans.menu.alerts || 'Alerts',
                type: 'item',
                url: '/data&reports/data-tracking/alerts'
              }
            ]
          }
        ]
      }
    ],
    [trans]
  );

  const otherMenu = useMemo(
    () => [
      {
        id: 'group-other',
        title: trans.menu.other || 'Other',
        icon: 'IconDotsVertical',
        type: 'group',
        children: [
          {
            id: 'other-group',
            title: trans.menu.others || 'Others',
            type: 'collapse',
            icon: 'IconHelp',
            children: [
              {
                id: 'equipment',
                title: trans.menu.equipmentManagement || 'Equipment Management',
                type: 'item',
                url: '/others/equipment'
              },
              {
                id: 'support',
                title: trans.menu.support || 'Support',
                type: 'item',
                url: '/others/support'
              }
            ]
          },
          {
            id: 'updates-group',
            title: trans.menu.updates || 'Updates',
            type: 'collapse',
            icon: 'IconRefresh',
            children: [
              {
                id: 'changelog',
                title: trans.menu.changelog || 'Changelog',
                type: 'item',
                url: '/others/updates'
              }
            ]
          }
        ]
      }
    ],
    [trans]
  );

  return {
    supervisor: supervisorMenu,
    dataReports: dataReportsMenu,
    other: otherMenu
  };
}
