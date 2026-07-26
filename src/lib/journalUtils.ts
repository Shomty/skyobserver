import { format, parseISO, isValid } from 'date-fns';
import { AIReport, SavedInterpretation } from '../services/aiReportService';

export interface JournalEntry {
  id: string;
  source: 'report' | 'interpretation';
  type: string;
  title: string;
  preview: string;
  markdown: string;
  createdAt: unknown;
}

const TYPE_LABELS: Record<string, string> = {
  'transit-impact': 'Transit Impact',
  'daily-insights': 'Daily Insights',
  'yoga-interpretation': 'Yoga Insight',
  'muhurta-analysis': 'Muhurta Window',
  'natal-planet-insights': 'Planet Insights',
  cosmic_analysis: 'Cosmic Analysis',
  general: 'AI Chat',
  transit: 'Transit Reading',
};

const SOUL_PROFILE_FIELDS: Record<string, string> = {
  gifts: 'Gifts & Talents',
  challenges: 'Life Challenges',
  shadowWork: 'Shadow Work',
  lifePurpose: 'Life Purpose',
  relationships: 'Relationships',
  careerPath: 'Career Path',
  spiritualPath: 'Spiritual Path',
};

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .trim();
}

function firstSentence(text: string, maxLen = 120): string {
  const cleaned = stripMarkdown(text.trim());
  if (!cleaned) return '';

  const line = cleaned.split('\n').find((part) => part.trim().length > 0) ?? cleaned;
  const match = line.match(/^[^.!?\n]+[.!?]?/);
  const sentence = (match?.[0] ?? line).trim();
  if (sentence.length <= maxLen) return sentence;
  return `${sentence.slice(0, maxLen - 1).trim()}…`;
}

function parseDateFromCacheKey(cacheKey: string): string | null {
  const jsDateMatch = cacheKey.match(/([A-Z][a-z]{2} [A-Z][a-z]{2} \d{1,2} \d{4})/);
  if (jsDateMatch) return jsDateMatch[1];

  const isoMatch = cacheKey.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z?/);
  if (isoMatch) {
    const parsed = parseISO(isoMatch[0]);
    if (isValid(parsed)) return format(parsed, 'MMM d, yyyy · h:mm a');
  }

  try {
    const parsed = JSON.parse(cacheKey) as { date?: string };
    if (parsed.date) {
      const date = parseISO(parsed.date);
      if (isValid(date)) return format(date, 'MMM d, yyyy');
    }
  } catch {
    // not JSON cache key
  }

  return null;
}

function titleFromCacheKey(type: string, cacheKey: string): string | null {
  const label = TYPE_LABELS[type] ?? type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (type === 'yoga-interpretation' && cacheKey.startsWith('yoga-interp-')) {
    return humanizeSlug(cacheKey.replace('yoga-interp-', ''));
  }

  const dateHint = parseDateFromCacheKey(cacheKey);
  if (dateHint) return `${label} — ${dateHint}`;

  if (type === 'natal-planet-insights') return 'Natal Planet Insights';

  try {
    const parsed = JSON.parse(cacheKey) as { date?: string; nakshatra?: string; tithi?: string };
    const parts = [label];
    if (parsed.date) {
      const date = parseISO(parsed.date);
      if (isValid(date)) parts.push(format(date, 'MMM d, yyyy'));
    }
    if (parsed.nakshatra) parts.push(parsed.nakshatra);
    return parts.join(' · ');
  } catch {
    return label;
  }
}

function formatRecordSections(
  record: Record<string, string>,
  headingPrefix = '',
): string {
  return Object.entries(record)
    .filter(([, value]) => typeof value === 'string' && value.trim())
    .map(([key, value]) => `### ${headingPrefix}${key}\n\n${value.trim()}`)
    .join('\n\n');
}

export function formatReportDataAsMarkdown(type: string, data: unknown): string {
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (!trimmed) return '_No content recorded._';
    if (/^[\[{]/.test(trimmed)) {
      try {
        return formatReportDataAsMarkdown(type, JSON.parse(trimmed));
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) return '_No content recorded._';
    return data
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'topic' in item && 'content' in item) {
          const topic = String((item as { topic: string }).topic);
          const content = String((item as { content: string }).content);
          return `### ${topic}\n\n${content.trim()}`;
        }
        return JSON.stringify(item, null, 2);
      })
      .join('\n\n');
  }

  if (!data || typeof data !== 'object') {
    return String(data ?? '_No content recorded._');
  }

  const record = data as Record<string, unknown>;

  if (typeof record.summary === 'string') {
    const sections: string[] = [`## Overview\n\n${record.summary.trim()}`];

    if (record.panchang && typeof record.panchang === 'object') {
      sections.push(formatRecordSections(record.panchang as Record<string, string>, 'Panchang · '));
    }
    if (record.blueprint && typeof record.blueprint === 'object') {
      sections.push(formatRecordSections(record.blueprint as Record<string, string>, 'Blueprint · '));
    }
    if (record.yogas && typeof record.yogas === 'object') {
      sections.push(formatRecordSections(record.yogas as Record<string, string>, 'Yoga · '));
    }
    if (record.planets && typeof record.planets === 'object') {
      sections.push(formatRecordSections(record.planets as Record<string, string>, 'Planet · '));
    }
    if (record.transits && typeof record.transits === 'object') {
      sections.push(formatRecordSections(record.transits as Record<string, string>, 'Transit · '));
    }

    return sections.filter(Boolean).join('\n\n');
  }

  if ('gifts' in record || 'challenges' in record) {
    return Object.entries(SOUL_PROFILE_FIELDS)
      .filter(([key]) => typeof record[key] === 'string' && String(record[key]).trim())
      .map(([key, heading]) => `### ${heading}\n\n${String(record[key]).trim()}`)
      .join('\n\n');
  }

  const stringEntries = Object.entries(record).filter(
    ([, value]) => typeof value === 'string' && value.trim(),
  ) as [string, string][];

  if (stringEntries.length > 0) {
    return formatRecordSections(Object.fromEntries(stringEntries));
  }

  return '```json\n' + JSON.stringify(data, null, 2) + '\n```';
}

export function getReportTitle(report: AIReport): string {
  const fromCache = titleFromCacheKey(report.type, report.cacheKey || '');
  const markdown = formatReportDataAsMarkdown(report.type, report.data);

  if (report.type === 'yoga-interpretation') {
    return fromCache ?? 'Yoga Insight';
  }

  if (report.type === 'daily-insights' && Array.isArray(report.data) && report.data[0]?.topic) {
    const topics = report.data.slice(0, 2).map((item: { topic: string }) => item.topic);
    const suffix = report.data.length > 2 ? ` +${report.data.length - 2} more` : '';
    return `${fromCache ?? 'Daily Insights'} — ${topics.join(', ')}${suffix}`;
  }

  const contentTitle = firstSentence(markdown, 90);
  if (contentTitle.length >= 20 && !contentTitle.startsWith('{')) {
    return contentTitle;
  }

  return fromCache ?? TYPE_LABELS[report.type] ?? 'Saved Insight';
}

export function getReportPreview(report: AIReport): string {
  const markdown = formatReportDataAsMarkdown(report.type, report.data);
  const stripped = stripMarkdown(markdown);
  if (!stripped) return 'No preview available.';
  return firstSentence(stripped, 160);
}

export function reportToJournalEntry(report: AIReport): JournalEntry {
  const markdown = formatReportDataAsMarkdown(report.type, report.data);
  return {
    id: report.id ?? report.cacheKey,
    source: 'report',
    type: report.type,
    title: getReportTitle(report),
    preview: getReportPreview(report),
    markdown,
    createdAt: report.createdAt,
  };
}

export function interpretationToJournalEntry(item: SavedInterpretation): JournalEntry {
  const title =
    item.title?.trim() ||
    firstSentence(item.content, 90) ||
    TYPE_LABELS[item.type] ||
    'Saved Note';

  return {
    id: item.id ?? title,
    source: 'interpretation',
    type: item.type || 'general',
    title,
    preview: firstSentence(item.content, 160) || 'No preview available.',
    markdown: item.context
      ? `> ${item.context.trim()}\n\n${item.content.trim()}`
      : item.content.trim(),
    createdAt: item.createdAt,
  };
}

export function getJournalTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function journalEntryTimestamp(entry: JournalEntry): number {
  const value = entry.createdAt as { toDate?: () => Date } | Date | string | number | null | undefined;
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  return 0;
}

export function formatJournalDate(entry: JournalEntry, pattern = 'MMM d, yyyy'): string {
  const ts = journalEntryTimestamp(entry);
  if (!ts) return 'Unknown Date';
  return format(new Date(ts), pattern);
}
