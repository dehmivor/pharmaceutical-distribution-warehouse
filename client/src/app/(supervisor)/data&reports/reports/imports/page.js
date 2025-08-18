// @next
import dynamic from 'next/dynamic';

// @project

const ImportReport = dynamic(() => import('@/views/supervisor/import-report'));

/***************************  IMPORT REPORT  ***************************/

export default function ImportReportPage() {
  return <ImportReport />;
}
