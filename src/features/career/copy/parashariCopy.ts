/** Parashari prose templates — original copy, BPHS-informed structure */

export function getEleventhFromAlAnalysis(
  sign: string,
  beneficInfluence: boolean,
  influencers: string[],
): string {
  const base = `The 11th from Arudha Lagna (${sign}) governs gains from public image and external status.`;
  if (influencers.length === 0) {
    return `${base} No strong graha influence — recognition grows through dasha and conscious brand-building.`;
  }
  if (beneficInfluence) {
    return `${base} Benefic influence (${influencers.join(', ')}) supports continuous material gains, external recognition, and societal prosperity from your public persona.`;
  }
  return `${base} Mixed or malefic pressure (${influencers.join(', ')}) asks for patience — gains come through sustained visibility and Purushartha rather than overnight fame.`;
}

const AMK_NATURE: Record<string, string> = {
  Sun: 'leadership, administration, and authority',
  Moon: 'public-facing care, hospitality, and adaptive management',
  Mars: 'execution, engineering, competition, and decisive action',
  Mercury: 'commerce, communication, analysis, and intellectual trade',
  Jupiter: 'strategy, advisory, law, education, and ethical guidance',
  Venus: 'creative industries, design, partnership, and luxury sectors',
  Saturn: 'long-term service, structure, labour, and institutional work',
  Rahu: 'technology, foreign ventures, and unconventional career paths',
  Ketu: 'research, specialization, and detached mastery',
};

export function getAmkWorkNature(amk: string): string {
  return AMK_NATURE[amk] ?? 'mixed professional expression';
}

export function getDashaGuidance(
  mdLord: string,
  adLord: string,
  mdFavorable: boolean,
  adFavorable: boolean,
): { paragraphs: string[]; bullets: string[] } {
  const bullets: string[] = [
    `Mahadasha ${mdLord}: ${mdFavorable ? 'linked to Kendra/Trikona or strong dignity — overarching theme supports growth' : 'rules dusthana or weak placement — period of purification and skill-building'}`,
    `Antardasha ${adLord}: ${adFavorable ? 'modulates daily experience toward opportunity and effort rewarded' : 'modulates daily experience toward obstacles that build resilience'}`,
  ];

  const paragraphs: string[] = [];

  if (mdFavorable && adFavorable) {
    paragraphs.push(
      `You operate under ${mdLord} Mahadasha with ${adLord} Antardasha — both lords connect favourably to angles, trines, or dignified placement. Expect career advancement, financial momentum, and overall well-being when effort aligns with the planetary themes.`,
    );
  } else if (mdFavorable && !adFavorable) {
    paragraphs.push(
      `${mdLord} Mahadasha sets a constructive long-term environment, while ${adLord} Antardasha introduces friction in daily outcomes. Use the MD's momentum but apply extra Purushartha during this AD — mantra, charity, and disciplined routine mitigate short-term drag.`,
    );
  } else if (!mdFavorable && adFavorable) {
    paragraphs.push(
      `${mdLord} Mahadasha emphasises spiritual purification through career tests, but ${adLord} Antardasha offers windows of relief and practical progress. Focus on the AD lord's houses and significations for near-term wins.`,
    );
  } else {
    paragraphs.push(
      `Both ${mdLord} and ${adLord} connect to challenging houses or weak dignity. Parashari teaching treats this as a remedial phase — not punishment, but invitation to growth through Mantra, Seva (service), and conscious self-effort rather than passive waiting.`,
    );
  }

  if (!mdFavorable || !adFavorable) {
    paragraphs.push(
      'Remedial guidance: recitation of the dasha lord\'s seed mantra, weekday charity aligned with the afflicted graha, and anchoring decisions in the strongest planet in your chart (check Vargottama grahas if present).',
    );
  }

  return { paragraphs, bullets };
}
