import { paginateAndPrint } from '../../career/lib/careerPrint';
import personalPrintCss from '../styles/personal-print.css?raw';

export function paginatePersonalReport(): Promise<void> {
  return paginateAndPrint('personal-report-print-root', personalPrintCss, {
    pagedRootId: 'personal-pagedjs-root',
    cssKey: 'personal-print.css',
  });
}
