import PropTypes from 'prop-types';
// @next
import dynamic from 'next/dynamic';

// @project
const WarehouseManagerLayout = dynamic(() => import('@/layouts/WarehouseManagerLayout'));

/***************************  LAYOUT - AUTH PAGES  ***************************/

export default function Layout({ children }) {
  return <WarehouseManagerLayout>{children}</WarehouseManagerLayout>;
}

Layout.propTypes = { children: PropTypes.any };
