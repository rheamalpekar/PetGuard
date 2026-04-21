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
    title: "Road Accident",
    keywords: ["hit", "car", "truck", "road", "bleeding", "fracture"],
    severity: SEVERITY.CRITICAL,
    classification: CLASSIFICATION.ACCIDENT,
    isEmergency: true,
    checklist: [
      "Is the animal breathing?",
      "Is there heavy bleeding?",
      "Is the animal trapped or unable to move?",
      "Is the location safe from traffic?",
      "Share the exact location immediately.",
    ],
    dispatchProtocol: "DISPATCH_RESCUE_IMMEDIATELY",
    requiredFields: ["description", "location"],
    responseTimeEstimateMin: 10,
  },
  {
    id: "animal_cruelty",
    title: "Animal Cruelty",
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
    checklist: [
      "Is the animal in immediate danger?",
      "Is the abuser still present nearby?",
      "Is it safe for you to stay at the location?",
      "Can you share the exact location?",
      "Is photo/video evidence available?",
    ],
    dispatchProtocol: "NOTIFY_ADMIN_AND_DISPATCH",
    requiredFields: ["description", "location"],
    responseTimeEstimateMin: 15,
  },
  {
    id: "sick_animal",
    title: "Sick Animal",
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
    checklist: [
      "Is the animal conscious?",
      "Is the animal breathing normally?",
      "Are there visible injuries?",
      "How long has the animal been sick?",
      "Does the animal need immediate transport?",
    ],
    dispatchProtocol: "SEND_HEALTH_ALERT",
    requiredFields: ["description"],
    responseTimeEstimateMin: 30,
  },
];

export function getScenarioCandidates(text: string) {
  const t = text.trim().toLowerCase();
  if (!t) return [];

  return EMERGENCY_SCENARIOS.filter((s) =>
    s.keywords.some((k) => t.includes(k)),
  );
}
