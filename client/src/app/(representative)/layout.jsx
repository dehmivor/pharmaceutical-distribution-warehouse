import PropTypes from 'prop-types';

// @next
import dynamic from 'next/dynamic';

// @project
const RepresentativeLayout = dynamic(() => import('@/layouts/RepresentativeLayout'));

/***************************  LAYOUT - ADMIN  ***************************/

export default function RepresentativePages({ children }) {
  return <RepresentativeLayout>{children}</RepresentativeLayout>;
}

RepresentativeLayout.propTypes = { children: PropTypes.any };
