import PropTypes from 'prop-types';

// @next
import dynamic from 'next/dynamic';

// @project
const PrototypeLayout = dynamic(() => import('@/layouts/PrototypeLayout'));

/***************************  LAYOUT - ADMIN  ***************************/

export default function Layout({ children }) {
  return <PrototypeLayout>{children}</PrototypeLayout>;
}

Layout.propTypes = { children: PropTypes.any };
