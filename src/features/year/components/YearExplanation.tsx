import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../lib/utils';

const LAYERS = [
  {
    title: 'The core identity (D1)',
    body: 'The rising sign, its degree, and its Nakshatra describe physical ease, intellect, and innate temperament. Planets in the same sign in the birth chart and the Navamsha, called Vargottama, carry the strongest inner alignment.',
  },
  {
    title: 'The inner path and union (D9)',
    body: 'The Navamsha shows the fruit of what the birth chart promises, including the shape of partnership. The Upapada, the marriage marker counted from the house after the rising sign, is read together with the Navamsha. Gulika or Mandi on that relationship axis is treated as a karmic lesson, spoken about with care.',
  },
  {
    title: 'The path of action (D10)',
    body: 'The Dashamsha reads power, position, and public life. The Amatyakaraka, the planet next in degree after the soul planet, points to professional purpose, especially when it touches the 10th house of that chart. Gulika there is a growth assignment, not a closed career.',
  },
  {
    title: 'Current timing (Vimshottari)',
    body: 'The year is timed with Vimshottari dasha, the period system used across a 120-year span. The active major and sub-periods are read in all three charts. An awake planet, in its own sign or exaltation, can open its promises. A heavy stretch comes with a mantra and a mindset practice, because you remain the co-creator of the year.',
  },
] as const;

export function YearExplanation() {
  const { theme } = useTheme();
  const muted = theme === 'dark' ? 'text-white/60' : 'text-slate-600';

  return (
    <section className="space-y-4" aria-labelledby="year-explanation-title">
      <div className="space-y-2">
        <h2 id="year-explanation-title" className="font-serif text-heading">
          How this year is read
        </h2>
        <p className={cn('text-body max-w-2xl', muted)}>
          This is not a sun-sign forecast. It is a Jyotish consultation for the calendar year, built from your
          birth chart. The chart is a map of potential. Purushartha, the effort you bring, is what turns a
          tendency into a life.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {LAYERS.map((layer) => (
          <article
            key={layer.title}
            className={cn(
              'rounded-2xl border p-4',
              theme === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-white',
            )}
          >
            <h3 className="font-serif text-title">{layer.title}</h3>
            <p className={cn('mt-2 text-body', muted)}>{layer.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
