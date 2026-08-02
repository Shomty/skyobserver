/** [HEURISTIC] Dasha activation role weights — tunable without touching logic. */
export const DASHA_ROLE_SCORES: Record<string, number> = {
  d1TenthLord: 30,
  d10TenthLord: 30,
  amatyakaraka: 25,
  d10LagnaLord: 15,
  d1TenthOccupant: 15,
  d10TenthOccupant: 15,
  d1Upachaya: 15,
  d10Upachaya: 20,
  atmakaraka: 10,
  vargottama: 10,
  d1TenthAspector: 8,
  dusthanaOccupant: -20,
  dusthanaLord: -15,
  gulikaAssociated: -20,
  maandiAssociated: -15,
};

/** [HEURISTIC] Wealth-timing role weights for peak earning windows. */
export const WEALTH_ROLE_SCORES: Record<string, number> = {
  d1SecondLord: 25,
  d1EleventhLord: 30,
  d10EleventhLord: 25,
  d1EleventhOccupant: 15,
  d10EleventhOccupant: 15,
  d1SecondOccupant: 10,
  d10SecondOccupant: 10,
  vargottama: 8,
  dusthanaOccupant: -15,
  dusthanaLord: -10,
};

export const DASHA_MODIFIERS = {
  debilitatedMultiplier: 0.6,
  combustMultiplier: 0.75,
  vargottamaMultiplier: 1.15,
} as const;

export const ACTIVATION_KIND_THRESHOLDS = {
  promotion: 50,
  expansion: 25,
  transition: -25,
  caution: -50,
} as const;

/** [HEURISTIC] Job vs business scoring weights. */
export const JOB_VS_BUSINESS_WEIGHTS = {
  tenthLordIn1_7_11: 15,
  tenthLordIn6: -20,
  strong7thHouse: 10,
  d10LagnaStrong: 10,
  sunStrongInKendra: 10,
  saturnStrongIn6or10: -15,
  amkInD10Kendra: 10,
  compoundingUpachaya: 10,
  mercuryRahuLink: 10,
  businessThreshold: 20,
  jobThreshold: -20,
} as const;
