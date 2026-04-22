import {
  getScenarioCandidates,
  SEVERITY,
  CLASSIFICATION,
} from "./emergencyScenarios";

import type {
  EmergencyDetectionInput,
  EmergencyDetectionResult,
  EmergencyScenario,
} from "@/types/DataModels";

const SEVERITY_PRIORITY: Record<string, number> = {
  [SEVERITY.CRITICAL]: 4,
  [SEVERITY.HIGH]: 3,
  [SEVERITY.MEDIUM]: 2,
  [SEVERITY.LOW]: 1,
};

const DEFAULT_COUNTDOWN: Record<string, number> = {
  [SEVERITY.CRITICAL]: 10,
  [SEVERITY.HIGH]: 15,
  [SEVERITY.MEDIUM]: 20,
  [SEVERITY.LOW]: 0,
};

export function detectEmergency({
  emergencyType = '',
  description = '',
}: EmergencyDetectionInput): EmergencyDetectionResult {
  const start = Date.now();

  const combinedText = `${emergencyType} ${description}`.toLowerCase().trim();

  if (!combinedText) {
    return {
      isEmergency: false,
      severity: SEVERITY.LOW,
      classification: CLASSIFICATION.UNKNOWN,
      scenarioId: null,
      checklist: [],
      dispatchProtocol: "NO_DISPATCH_REQUIRED",
      countdownSeconds: 0,
      detectionMs: Date.now() - start,
      matchedKeywords: [],
    };
  }

  const candidates = getScenarioCandidates(combinedText);

  let bestMatch: EmergencyScenario | null = null;

  for (const scenario of candidates) {
    if (!bestMatch) {
      bestMatch = scenario;
      continue;
    }

    const currentPriority = SEVERITY_PRIORITY[scenario.severity] ?? 0;
    const bestPriority = SEVERITY_PRIORITY[bestMatch.severity] ?? 0;

    if (currentPriority > bestPriority) {
      bestMatch = scenario;
    }
  }

  // Fallback heuristics: if nothing matched OR the matched scenario lacks
  // richer guidance (protocol/checklist), upgrade to a fallback scenario.
  const needsFallbackGuidance =
    !bestMatch || !bestMatch.dispatchProtocol || !bestMatch.checklist?.length;

  if (needsFallbackGuidance) {
    if (
      combinedText.includes("cruelty") ||
      combinedText.includes("abuse") ||
      combinedText.includes("beating") ||
      combinedText.includes("neglect")
    ) {
      bestMatch = {
        id: "fallback_cruelty",
        title: "Fallback Cruelty Detection",
        keywords: [],
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
      };
    } else if (
      combinedText.includes("accident") ||
      combinedText.includes("hit") ||
      combinedText.includes("car") ||
      combinedText.includes("road") ||
      combinedText.includes("bleeding")
    ) {
      bestMatch = {
        id: "fallback_accident",
        title: "Fallback Accident Detection",
        keywords: [],
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
      };
    } else if (
      combinedText.includes("sick") ||
      combinedText.includes("weak") ||
      combinedText.includes("vomit") ||
      combinedText.includes("fever") ||
      combinedText.includes("breathing problem") ||
      combinedText.includes("injury")
    ) {
      bestMatch = {
        id: "fallback_sick",
        title: "Fallback Sick Detection",
        keywords: [],
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
      };
    }
  }

  if (!bestMatch) {
    return {
      isEmergency: false,
      severity: SEVERITY.LOW,
      classification: CLASSIFICATION.UNKNOWN,
      scenarioId: null,
      checklist: [],
      dispatchProtocol: "NO_DISPATCH_REQUIRED",
      countdownSeconds: 0,
      detectionMs: Date.now() - start,
      matchedKeywords: [],
    };
  }

  const matchedKeywords =
    bestMatch.keywords?.filter((keyword: string) =>
      combinedText.includes(keyword.toLowerCase())
    ) ?? [];

  return {
    isEmergency: bestMatch.isEmergency,
    severity: bestMatch.severity,
    classification: bestMatch.classification,
    scenarioId: bestMatch.id,
    checklist: bestMatch.checklist ?? [],
    dispatchProtocol: bestMatch.dispatchProtocol ?? "TRIAGE",
    countdownSeconds: DEFAULT_COUNTDOWN[bestMatch.severity] ?? 0,
    detectionMs: Date.now() - start,
    matchedKeywords,
  };
}
