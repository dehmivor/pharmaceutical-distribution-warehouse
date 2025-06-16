import PropTypes from 'prop-types';

// @next
import dynamic from 'next/dynamic';

// @project
const RepresentativeLayout = dynamic(() => import('@/layouts/RepresentativeLayout'));

/***************************  LAYOUT - ADMIN  ***************************/

export default function Layout({ children }) {
  return <RepresentativeLayout>{children}</RepresentativeLayout>;
}

Layout.propTypes = { children: PropTypes.any };
