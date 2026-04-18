export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
};

export const CLASSIFICATION = {
  SICK: "sick",
  ACCIDENT: "accident",
  CRUELTY: "cruelty",
  UNKNOWN: "unknown",
};

export function getScenarioCandidates(text: string) {
  const scenarios = [
    {
      id: "road_accident",
      keywords: ["hit", "car", "truck", "road", "bleeding", "fracture"],
      severity: SEVERITY.CRITICAL,
      classification: CLASSIFICATION.ACCIDENT,
      isEmergency: true,
    },
    {
      id: "animal_cruelty",
      keywords: [
        "abuse",
        "abused",
        "cruelty",
        "neglect",
        "beaten",
        "starved",
        "chained",
      ],
      severity: SEVERITY.HIGH,
      classification: CLASSIFICATION.CRUELTY,
      isEmergency: true,
    },
    {
      id: "sick_animal",
      keywords: [
        "sick",
        "vomiting",
        "fever",
        "seizure",
        "lethargic",
        "infection",
        "poison",
      ],
      severity: SEVERITY.HIGH,
      classification: CLASSIFICATION.SICK,
      isEmergency: true,
    },
  ];

  const t = text.trim().toLowerCase();
  if (!t) return [];

  return scenarios.filter((s) => s.keywords.some((k) => t.includes(k)));
}
