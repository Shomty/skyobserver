import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

/** Renders Gem synthesis text with ## section headings. */
export function SynthesisMarkdownBody({ text, className }: { text: string; className?: string }) {
  const { theme } = useTheme();
  const chunks = text.split(/\n(?=## )/);

  return (
    <div className={cn('space-y-6', className)}>
      {chunks.map((chunk) => {
        const trimmed = chunk.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('## ')) {
          const newline = trimmed.indexOf('\n');
          const heading = newline === -1 ? trimmed.slice(3).trim() : trimmed.slice(3, newline).trim();
          const body = newline === -1 ? '' : trimmed.slice(newline + 1).trim();
          return (
            <section key={heading}>
              <h4
                className={cn(
                  'font-serif text-title',
                  theme === 'dark' ? 'text-jyotish-gold/90' : 'text-amber-900',
                )}
              >
                {heading}
              </h4>
              {body ? (
                <div className="mt-3 space-y-3">
                  {body.split(/\n\n+/).map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 48)}
                      className={cn(
                        'text-body leading-relaxed',
                        theme === 'dark' ? 'text-white/80' : 'text-slate-700',
                      )}
                    >
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              ) : null}
            </section>
          );
        }

        return trimmed.split(/\n\n+/).map((paragraph) => (
          <p
            key={paragraph.slice(0, 48)}
            className={cn('text-body leading-relaxed', theme === 'dark' ? 'text-white/80' : 'text-slate-700')}
          >
            {paragraph.trim()}
          </p>
        ));
      })}
    </div>
  );
}
