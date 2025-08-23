'use client';

// @project
import Error500Page from '@/components/Error500';

/***************************  ERROR 500 - DATA  ***************************/

const data = {
  primaryBtn: { children: 'Back to Login Page', onClick: () => (window.location.href = '/auth/login') },
  heading: "You don't have permission to access this page."
};

/***************************  ERROR - INTERNAL SERVER ERROR  ***************************/

export default function InternalServerError() {
  return <Error500Page {...data} />;
}
