export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const CLASSIFICATION = {
  SICK: 'sick',
  ACCIDENT: 'accident',
  CRUELTY: 'cruelty',
  UNKNOWN: 'unknown',
};

export function getScenarioCandidates(text: string) {
  const scenarios = [
    {
      id: 'road_accident',
      keywords: ['hit', 'car', 'truck', 'road', 'bleeding', 'fracture'],
      severity: SEVERITY.CRITICAL,
      classification: CLASSIFICATION.ACCIDENT,
      isEmergency: true,
    },
  ];

  const t = text.toLowerCase();
  return scenarios.filter((s) => s.keywords.some((k) => t.includes(k)));
}
