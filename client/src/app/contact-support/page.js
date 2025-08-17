// @next
import dynamic from 'next/dynamic';

// @project

const ContactSupport = dynamic(() => import('@/views/general/contact-support'));

/***************************  AUTH - LOGIN  ***************************/

export default function ContactSupportPage() {
  return <ContactSupport />;
}
