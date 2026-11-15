import { describe, expect, it } from 'vitest';
import { formatReportDataAsMarkdown, getJournalTypeLabel } from './journalUtils';

describe('funnel interpretations in the journal', () => {
  it('renders a text synthesis without its metadata', () => {
    const md = formatReportDataAsMarkdown('career_synthesis', {
      text: '## Your path\n\nLeadership suits you.',
      fingerprint: 'syn-v2|abc',
      generatedAt: '2026-10-15T10:00:00Z',
    });
    expect(md).toBe('## Your path\n\nLeadership suits you.');
  });

  it('renders structured guidance as sections and bullets', () => {
    const md = formatReportDataAsMarkdown('daily_guidance', {
      guidance: {
        todayRead: 'A quiet, inward day.',
        weekDays: [{ date: '2026-10-16', label: 'Fri', read: 'Momentum returns.' }],
        practicalMoves: 'Batch admin in the morning.',
      },
      fingerprint: 'g-v2|x',
      generatedAt: '2026-10-15T10:00:00Z',
    });
    expect(md).toContain('### Today Read\n\nA quiet, inward day.');
    expect(md).toContain('### Week Days\n\n- **Fri** — Momentum returns.');
    expect(md).toContain('### Practical Moves');
    expect(md).not.toContain('fingerprint');
  });

  it('labels the new report types', () => {
    expect(getJournalTypeLabel('career_synthesis')).toBe('Career Reading');
    expect(getJournalTypeLabel('personal_guidance')).toBe('Personal Guidance');
    expect(getJournalTypeLabel('year_horoscope')).toBe('Year Ahead');
  });
});
