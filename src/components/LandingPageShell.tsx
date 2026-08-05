/** Static first-paint shell for the homepage — no JS dependencies beyond CSS. */
export function LandingPageShell() {
  return (
    <div className="landing-shell universe-bg light relative min-h-screen text-ink-primary">
      <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-32 md:px-8 md:pt-40">
        <p className="landing-kicker mb-8">Your personal pattern studio</p>
        <h1 className="max-w-3xl font-serif text-[clamp(3rem,9vw,7.7rem)] font-medium italic leading-[0.82] tracking-[-0.045em] text-ink-primary">
          See the pattern behind your time.
        </h1>
        <p className="mt-8 max-w-xl text-base leading-7 text-ink-secondary md:text-lg">
          Map your personality blueprint, life chapters, and daily emotional weather
          in one calm, precise workspace.
        </p>
      </div>
    </div>
  );
}
