import { forwardRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import { cn } from '../../lib/utils';

/**
 * Markdown for AI chat replies with explicit element styles. The app does not
 * ship @tailwindcss/typography, so `prose` classes are no-ops; without this,
 * headings, paragraphs and lists render unspaced and unstyled.
 *
 * Rhythm: sections (h2) get the most space above, sub-headings less, body
 * blocks a steady gap; the first/last child margins are trimmed so the bubble
 * padding stays even.
 */
function buildComponents(isDark: boolean): Components {
  const body = isDark ? 'text-white/80' : 'text-ink-secondary';
  const strong = isDark ? 'text-jyotish-gold/95' : 'text-ink-primary';
  const rule = isDark ? 'border-white/10' : 'border-border-gold';
  const heading = isDark ? 'text-jyotish-gold' : 'text-jyotish-gold-deep';

  return {
    h1: ({ children }) => (
      <h3 className={cn('mt-8 mb-3 font-serif text-[1.65rem] font-semibold leading-snug', heading)}>{children}</h3>
    ),
    h2: ({ children }) => (
      <h3 className={cn('mt-8 mb-3 pb-2 border-b font-serif text-[1.4rem] font-semibold leading-snug', heading, rule)}>
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className={cn('mt-5 mb-2 text-[0.95rem] font-semibold leading-snug', isDark ? 'text-celestial-gold' : 'text-ink-primary')}>
        {children}
      </h4>
    ),
    h4: ({ children }) => (
      <h5 className={cn('mt-4 mb-1.5 text-xs font-semibold uppercase tracking-wider', isDark ? 'text-white/60' : 'text-ink-muted')}>
        {children}
      </h5>
    ),
    p: ({ children }) => <p className={cn('my-3 leading-7', body)}>{children}</p>,
    ul: ({ children }) => (
      <ul className={cn('my-3 pl-5 space-y-2 list-disc marker:text-jyotish-gold/70', body)}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={cn('my-3 pl-5 space-y-2 list-decimal marker:text-jyotish-gold/80 marker:font-semibold', body)}>{children}</ol>
    ),
    li: ({ children }) => <li className="pl-1 leading-7 [&>p]:my-1 [&>ul]:mt-2 [&>ol]:mt-2">{children}</li>,
    strong: ({ children }) => <strong className={cn('font-semibold', strong)}>{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote
        className={cn(
          'my-4 rounded-r-lg border-l-2 border-jyotish-gold/60 py-1 pl-4 pr-3 italic [&>p]:my-1.5',
          isDark ? 'bg-jyotish-gold/[0.06] text-white/75' : 'bg-jyotish-gold/5 text-ink-secondary'
        )}
      >
        {children}
      </blockquote>
    ),
    hr: () => <hr className={cn('my-6 border-t', rule)} />,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('underline underline-offset-2', isDark ? 'text-cosmic-glow' : 'text-cosmic-deep')}
      >
        {children}
      </a>
    ),
    code: ({ children }) => (
      <code className={cn('rounded px-1.5 py-0.5 font-mono text-[0.85em]', isDark ? 'bg-white/10' : 'bg-surface-muted')}>
        {children}
      </code>
    ),
  };
}

const DARK_COMPONENTS = buildComponents(true);
const LIGHT_COMPONENTS = buildComponents(false);

interface ChatMarkdownProps {
  content: string;
  theme: 'dark' | 'light';
  className?: string;
}

const ChatMarkdown = forwardRef<HTMLDivElement, ChatMarkdownProps>(({ content, theme, className }, ref) => (
  <div
    ref={ref}
    className={cn('text-[0.925rem] [&>:first-child]:mt-0 [&>:last-child]:mb-0', className)}
  >
    <ReactMarkdown components={theme === 'dark' ? DARK_COMPONENTS : LIGHT_COMPONENTS}>{content}</ReactMarkdown>
  </div>
));
ChatMarkdown.displayName = 'ChatMarkdown';

export default ChatMarkdown;
