import PropTypes from 'prop-types';

// @next
import dynamic from 'next/dynamic';

// @project
const RepresentativeManagerLayout = dynamic(() => import('@/layouts/RepresentativeManagerLayout'));

/***************************  LAYOUT - ADMIN  ***************************/

export default function RepresentativeManagerPages({ children }) {
  return <RepresentativeManagerLayout>{children}</RepresentativeManagerLayout>;
}

RepresentativeManagerLayout.propTypes = { children: PropTypes.any };
