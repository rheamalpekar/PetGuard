import {
  EMERGENCY_CLASSIFICATION,
  PRIORITY,
  type EmergencyScenario,
} from "@/types/DataModels";

export const SEVERITY = PRIORITY;
export const CLASSIFICATION = EMERGENCY_CLASSIFICATION;

export const EMERGENCY_SCENARIOS: EmergencyScenario[] = [
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

export function getScenarioCandidates(text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return [];

  return EMERGENCY_SCENARIOS.filter((s) =>
    s.keywords.some((k) => t.includes(k)),
  );
}
