import PropTypes from 'prop-types';
// @next
import dynamic from 'next/dynamic';

// @project
const SupervisorLayout = dynamic(() => import('@/layouts/SupervisorLayout'));

/***************************  LAYOUT - AUTH PAGES  ***************************/

export default function Layout({ children }) {
  return <SupervisorLayout>{children}</SupervisorLayout>;
}

Layout.propTypes = { children: PropTypes.any };
