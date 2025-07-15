'use client';

// @project
import Success from '@/components/Success';

/***************************  ERROR 500 - DATA  ***************************/

const data = {
  primaryBtn: { children: 'Back to Home Page' },
  heading: 'You have successfully completed transaction payment'
};

/***************************  ERROR - INTERNAL SERVER ERROR  ***************************/

export default function InternalServerError() {
  return <Success {...data} />;
}
