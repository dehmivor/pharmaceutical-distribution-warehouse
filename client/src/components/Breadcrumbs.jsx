'use client';
import PropTypes from 'prop-types';

import { useEffect, useState } from 'react';

// @next
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// @mui
import { useTheme } from '@mui/material/styles';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';

// @project
import { APP_DEFAULT_PATH } from '@/config';
import menuItems from '@/menu';
import { generateFocusStyle } from '@/utils/generateFocusStyle';

// @assets
import { IconChevronRight } from '@tabler/icons-react';

/***************************  BREADCRUMBS  ***************************/

export default function Breadcrumbs({ data }) {
  const theme = useTheme();
  const location = usePathname();

  const [breadcrumbItems, setBreadcrumbItems] = useState([]);
  const [activeItem, setActiveItem] = useState();

  // Get user role from localStorage and create home URL
  const getHomeBreadcrumb = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role;

          // Map role to home URL
          const roleHomeMap = {
            supervisor: '/sp-home',
            representative: '/rp-home',
            warehouse: '/wh-home',
            warehouse_manager: '/wm-home',
            representative_manager: '/rm-home'
          };

          const homeUrl = roleHomeMap[role] || '/';
          return { title: 'Home', url: homeUrl };
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }
    return { title: 'Home', url: '/' };
  };

  useEffect(() => {
    if (data?.length) {
      dataHandler(data);
    } else {
      // Check if current page is a home page
      const homeBreadcrumb = getHomeBreadcrumb();
      const isHomePage = location === homeBreadcrumb.url;

      if (isHomePage) {
        // Show only "Home" for home pages
        setBreadcrumbItems([]);
        setActiveItem({ title: 'Home', url: location });
        return;
      }

      // Use original logic for all other pages
      for (const menu of menuItems?.items) {
        if (menu.type && menu.type === 'group') {
          const matchedParents = findParentElements(menu.children || [], location);
          dataHandler(matchedParents || []);
          if (matchedParents) break;
        }
      }

      // Also check supervisor menu
      for (const menu of menuItems?.supervisor) {
        if (menu.type && menu.type === 'group') {
          const matchedParents = findParentElements(menu.children || [], location);
          dataHandler(matchedParents || []);
          if (matchedParents) break;
        }
      }

      // Also check representative menu
      for (const menu of menuItems?.representative) {
        if (menu.type && menu.type === 'group') {
          const matchedParents = findParentElements(menu.children || [], location);
          dataHandler(matchedParents || []);
          if (matchedParents) break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, location]);

  const dataHandler = (data) => {
    console.log('Breadcrumb data:', data);
    const active = data.at(-1);
    const linkItems = data.slice(0, -1);
    const homeBreadcrumb = getHomeBreadcrumb();

    if (active && active.url !== homeBreadcrumb.url) {
      linkItems.unshift(homeBreadcrumb);
    }
    setActiveItem(active);
    setBreadcrumbItems(linkItems);
  };

  function findParentElements(navItems, targetUrl, parents = []) {
    for (const item of navItems) {
      const newParents = [...parents, item];

      if (item.url && (targetUrl === item.url || targetUrl.startsWith(item.url + '/'))) {
        if (item.children) {
          const deeper = findParentElements(item.children, targetUrl, newParents);
          if (deeper) {
            return deeper;
          }
        }
        return newParents;
      }

      if (item.children) {
        const result = findParentElements(item.children, targetUrl, newParents);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  return (
    <MuiBreadcrumbs aria-label="breadcrumb" separator={<IconChevronRight size={16} />}>
      {breadcrumbItems.length &&
        breadcrumbItems.map((item, index) => (
          <Typography
            {...(item.url && { component: Link, href: item.url })}
            variant="body2"
            sx={{
              p: 0.5,
              color: 'grey.700',
              textDecoration: 'none',
              ...(item.url && { cursor: 'pointer', ':hover': { color: 'primary.main' } }),
              ':focus-visible': { outline: 'none', borderRadius: 0.25, ...generateFocusStyle(theme.palette.primary.main) }
            }}
            key={index}
          >
            {item.title}
          </Typography>
        ))}
      {activeItem && (
        <Typography variant="body2" sx={{ p: 0.5 }}>
          {activeItem.title}
        </Typography>
      )}
    </MuiBreadcrumbs>
  );
}

Breadcrumbs.propTypes = { data: PropTypes.array };
