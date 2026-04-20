import { getScenarioCandidates, SEVERITY, CLASSIFICATION } from './emergencyScenarios';
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
  [SEVERITY.HIGH]: 20,
  [SEVERITY.MEDIUM]: 30,
  [SEVERITY.LOW]: 0,
};

export function detectEmergency({
  emergencyType = '',
  description = '',
}: EmergencyDetectionInput): EmergencyDetectionResult {
  const start = Date.now();
  const text = `${emergencyType} ${description}`.toLowerCase();

  const candidates = getScenarioCandidates(text);

  let best: EmergencyScenario | null = null;

  for (const scenario of candidates) {
    if (!best) best = scenario;
    else if (
      SEVERITY_PRIORITY[scenario.severity] > SEVERITY_PRIORITY[best.severity]
    )
      best = scenario;
  }

  if (!best) {
    const dangerWords = [
      'bleeding',
      'unconscious',
      'fracture',
      'hit',
      'burn',
      'attack',
      'seizure',
    ];
    const dangerHit = dangerWords.some((w) => text.includes(w));

    if (dangerHit) {
      best = {
        id: 'heuristic_high_risk',
        keywords: [],
        isEmergency: true,
        severity: SEVERITY.HIGH,
        classification: CLASSIFICATION.ACCIDENT,
        checklist: ['Move to safe area', 'Share location', 'Avoid human medicine'],
        dispatchProtocol: 'DISPATCH_TRIAGE',
      };
    }
  }

  const result = best
    ? {
        isEmergency: !!best.isEmergency,
        severity: best.severity,
        classification: best.classification,
        scenarioId: best.id,
        checklist: best.checklist || [],
        dispatchProtocol: best.dispatchProtocol || 'TRIAGE',
        countdownSeconds: DEFAULT_COUNTDOWN[best.severity] ?? 0,
      }
    : {
        isEmergency: false,
        severity: SEVERITY.LOW,
        classification: CLASSIFICATION.UNKNOWN,
        scenarioId: null,
        checklist: [],
        dispatchProtocol: 'NONE',
        countdownSeconds: 0,
      };

  return { ...result, detectionMs: Date.now() - start };
}
