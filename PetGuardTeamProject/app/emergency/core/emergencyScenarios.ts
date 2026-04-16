export const SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const CLASSIFICATION = {
  SICK: "sick",
  ACCIDENT: "accident",
  CRUELTY: "cruelty",
  UNKNOWN: "unknown",
} as const;

export type SeverityType = (typeof SEVERITY)[keyof typeof SEVERITY];
export type ClassificationType =
  (typeof CLASSIFICATION)[keyof typeof CLASSIFICATION];

export type EmergencyScenario = {
  id: string;
  title: string;
  keywords: string[];
  classification: ClassificationType;
  isEmergency: boolean;
  severity: SeverityType;
  requiredFields: string[];
  responseTimeEstimateMin: number;
  dispatchProtocol: string;
  checklist: string[];
};

export const emergencyScenarios: EmergencyScenario[] = [
  {
    id: "road_accident",
    title: "Road Accident / Hit by Vehicle",
    keywords: [
      "accident",
      "car accident",
      "road accident",
      "hit by car",
      "hit",
      "vehicle",
      "truck",
      "crash",
      "injured on road",
      "bleeding",
      "fracture",
      "broken leg",
    ],
    classification: CLASSIFICATION.ACCIDENT,
    isEmergency: true,
    severity: SEVERITY.CRITICAL,
    requiredFields: ["description", "location"],
    responseTimeEstimateMin: 10,
    dispatchProtocol: "DISPATCH_RESCUE_IMMEDIATELY",
    checklist: [
      "Is the animal breathing?",
      "Is there heavy bleeding?",
      "Is the animal trapped or unable to move?",
      "Is the location safe from traffic?",
      "Share the exact location immediately.",
    ],
  },
  {
    id: "animal_cruelty",
    title: "Animal Cruelty / Abuse",
    keywords: [
      "cruelty",
      "abuse",
      "animal cruelty",
      "beating",
      "hurt animal",
      "violence",
      "neglect",
      "starving",
      "injury by person",
      "unsafe owner",
    ],
    classification: CLASSIFICATION.CRUELTY,
    isEmergency: true,
    severity: SEVERITY.HIGH,
    requiredFields: ["description", "location"],
    responseTimeEstimateMin: 15,
    dispatchProtocol: "NOTIFY_ADMIN_AND_DISPATCH",
    checklist: [
      "Is the animal in immediate danger?",
      "Is the abuser still present nearby?",
      "Is it safe for you to stay at the location?",
      "Can you share the exact location?",
      "Is photo/video evidence available?",
    ],
  },
  {
    id: "sick_animal",
    title: "Sick / Weak Animal",
    keywords: [
      "sick",
      "ill",
      "weak",
      "not eating",
      "vomit",
      "vomiting",
      "fever",
      "breathing problem",
      "difficulty breathing",
      "infection",
      "unwell",
      "injury",
      "hurt",
      "pain",
    ],
    classification: CLASSIFICATION.SICK,
    isEmergency: true,
    severity: SEVERITY.MEDIUM,
    requiredFields: ["description"],
    responseTimeEstimateMin: 30,
    dispatchProtocol: "SEND_HEALTH_ALERT",
    checklist: [
      "Is the animal conscious?",
      "Is the animal breathing normally?",
      "Are there visible injuries?",
      "How long has the animal been sick?",
      "Does the animal need immediate transport?",
    ],
  },
  {
    id: "minor_concern",
    title: "Minor / Non-Emergency Concern",
    keywords: [
      "vaccination",
      "adopt",
      "adoption",
      "surrender",
      "spay",
      "neuter",
      "general inquiry",
      "checkup",
    ],
    classification: CLASSIFICATION.UNKNOWN,
    isEmergency: false,
    severity: SEVERITY.LOW,
    requiredFields: ["description"],
    responseTimeEstimateMin: 120,
    dispatchProtocol: "NO_DISPATCH_REQUIRED",
    checklist: [],
  },
];

export function getScenarioCandidates(text: string): EmergencyScenario[] {
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) return [];

  return emergencyScenarios.filter((scenario) =>
    scenario.keywords.some((keyword) =>
      normalizedText.includes(keyword.toLowerCase())
    )
  );
}