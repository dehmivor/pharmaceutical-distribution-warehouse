import PropTypes from 'prop-types';
// @mui
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';

// @project
import NavCollapse from './NavCollapse';
import NavItem from './NavItem';

/***************************  RESPONSIVE DRAWER - GROUP  ***************************/

export default function NavGroup({ item, pathname }) {
  const renderNavItem = (menuItem) => {
    switch (menuItem.type) {
      case 'collapse':
        // Truyền pathname cho NavCollapse để xử lý highlight con
        return <NavCollapse key={menuItem.id} item={menuItem} pathname={pathname} />;
      case 'item':
        // Truyền pathname cho NavItem để xử lý highlight
        return <NavItem key={menuItem.id} item={menuItem} pathname={pathname} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" color="error" align="center">
            Fix - Group Collapse or Items
          </Typography>
        );
    }
  };

  return (
    <List
      component="div"
      subheader={
        <Typography component="div" variant="caption" sx={{ mb: 0.75, color: 'grey.700' }}>
          {item.title}
        </Typography>
      }
      sx={{ '&:not(:first-of-type)': { pt: 1, borderTop: '1px solid', borderColor: 'divider' } }}
    >
      {item.children?.map((menuItem) => renderNavItem(menuItem))}
    </List>
  );
}

NavGroup.propTypes = { item: PropTypes.any };
