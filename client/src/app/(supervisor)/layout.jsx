'use client';
import PropTypes from 'prop-types';

// @project
import SupervisorLayout from '@/layouts/SupervisorLayout';

/***************************  LAYOUT - AUTH PAGES  ***************************/

export default function Layout({ children }) {
  return <SupervisorLayout>{children}</SupervisorLayout>;
}

Layout.propTypes = { children: PropTypes.any };
