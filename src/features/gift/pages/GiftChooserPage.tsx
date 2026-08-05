import { GiftChooser } from '../components/GiftChooser';
import { GiftShell } from '../components/GiftShell';
import { usePageMeta } from '../../../lib/seo';

export default function GiftChooserPage() {
  usePageMeta({
    title: 'Gift a Vedic Astrology Reading | Vedic Sky',
    description: 'Send a thoughtful sidereal birth chart reading as a gift. Choose a report type and share a personalized Vedic astrology gift link.',
    path: '/gift',
  });

  return (
    <GiftShell>
      <GiftChooser />
    </GiftShell>
  );
}
