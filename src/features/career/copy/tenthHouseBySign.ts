/** 10th-house sign → career-house paragraph (whole-sign system). */
export const TENTH_HOUSE_BY_SIGN: Record<string, string> = {
  Aries:
    'Aries on the 10th brings a pioneering public image. You are seen as bold, direct, and willing to lead from the front — careers that reward initiative and quick decisions suit you well.',
  Taurus:
    'Taurus on the 10th grounds your reputation in reliability and tangible results. You build career success steadily, often through finance, design, agriculture, or anything that creates lasting material value.',
  Gemini:
    'Gemini on the 10th makes communication your professional signature. Writing, teaching, media, consulting, and roles that connect ideas across networks come naturally to your public path.',
  Cancer:
    'Cancer on the 10th ties your vocation to nurturing and protection. Hospitality, healthcare, real estate, food, and roles where people feel cared for align with how the world sees your work.',
  Leo:
    'Leo on the 10th places you in the spotlight. Leadership, creative direction, performance, politics, and any field where visibility and personal authority matter fit your natural career stage.',
  Virgo:
    'Virgo on the 10th emphasizes precision in your public role. Analysis, medicine, editing, quality control, and service-oriented professions where detail and improvement are valued suit you.',
  Libra:
    'Libra on the 10th seeks balance and partnership in career. Law, diplomacy, design, fashion, counseling, and collaborative ventures where aesthetics and fairness meet are strong fits.',
  Scorpio:
    'Scorpio on the 10th gives depth and intensity to your professional life. Research, psychology, surgery, investigation, occult sciences, and transformative industries resonate with your public path.',
  Sagittarius:
    'Sagittarius on the 10th expands your horizons through work. Teaching, publishing, travel, philosophy, international trade, and advisory roles that share wisdom suit your vocational calling.',
  Capricorn:
    'Capricorn on the 10th builds authority through discipline. Management, government, engineering, architecture, and long-term institutional roles where structure and endurance pay off align well.',
  Aquarius:
    'Aquarius on the 10th innovates in the public sphere. Technology, social reform, science, networking platforms, and unconventional careers that serve collective progress fit your path.',
  Pisces:
    'Pisces on the 10th dissolves boundaries in vocation. Arts, healing, spirituality, film, charity, and compassionate service where intuition guides practical work suit your public expression.',
};

export function getTenthHouseParagraph(sign: string): string {
  return TENTH_HOUSE_BY_SIGN[sign] ?? TENTH_HOUSE_BY_SIGN.Aries;
}
