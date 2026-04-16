import { detectEmergency } from "../app/emergency/core/EmergencyAlertSystem";

describe("Emergency Detection", () => {
  test("detects accident from direct scenario match", () => {
    const res = detectEmergency({
      emergencyType: "Car Accident",
      description: "dog hit by car and bleeding",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("accident");
  });

  test("detects cruelty from direct scenario match", () => {
    const res = detectEmergency({
      emergencyType: "Animal Cruelty",
      description: "animal abuse case",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("cruelty");
  });

  test("detects sick animal from direct scenario match", () => {
    const res = detectEmergency({
      emergencyType: "Sick Animal",
      description: "dog is weak and not eating",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("sick");
  });

  test("returns unknown for non-emergency case", () => {
    const res = detectEmergency({
      emergencyType: "Vaccination",
      description: "routine checkup",
    });

    expect(res.isEmergency).toBe(false);
    expect(res.classification).toBe("unknown");
    expect(res.scenarioId).toBeNull();
  });

  test("handles empty input safely", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "",
    });

    expect(res.isEmergency).toBe(false);
    expect(res.classification).toBe("unknown");
    expect(res.dispatchProtocol).toBe("NO_DISPATCH_REQUIRED");
  });

  test("handles partial input from emergencyType only", () => {
    const res = detectEmergency({
      emergencyType: "Accident",
      description: "",
    });

    expect(res).toBeDefined();
    expect(typeof res.isEmergency).toBe("boolean");
  });

  test("handles partial input from description only", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "dog hit by car",
    });

    expect(res).toBeDefined();
    expect(typeof res.isEmergency).toBe("boolean");
  });

  test("handles random unknown text", () => {
    const res = detectEmergency({
      emergencyType: "Something",
      description: "random unrelated text",
    });

    expect(res.classification).toBe("unknown");
    expect(res.isEmergency).toBe(false);
  });

  test("handles high severity keywords", () => {
    const res = detectEmergency({
      emergencyType: "Accident",
      description: "severe bleeding and critical injury",
    });

    expect(["critical", "high"]).toContain(res.severity);
  });

  test("handles medium severity sick case", () => {
    const res = detectEmergency({
      emergencyType: "Sick Animal",
      description: "dog vomiting and weak",
    });

    expect(["medium", "high", "critical"]).toContain(res.severity);
  });

  test("check checklist exists for emergency", () => {
    const res = detectEmergency({
      emergencyType: "Accident",
      description: "dog hit by car",
    });

    expect(res.checklist).toBeDefined();
    expect(Array.isArray(res.checklist)).toBe(true);
  });

  test("includes dispatch protocol for emergency", () => {
    const res = detectEmergency({
      emergencyType: "Animal Cruelty",
      description: "serious abuse case",
    });

    expect(res.dispatchProtocol).toBeDefined();
    expect(typeof res.dispatchProtocol).toBe("string");
  });

  test("returns countdown for emergency", () => {
    const res = detectEmergency({
      emergencyType: "Car Accident",
      description: "critical road accident with bleeding",
    });

    expect(typeof res.countdownSeconds).toBe("number");
    expect(res.countdownSeconds).toBeGreaterThanOrEqual(0);
  });

  test("returns scenarioId for matched emergency", () => {
    const res = detectEmergency({
      emergencyType: "Sick Animal",
      description: "dog vomiting and very weak",
    });

    expect(res.scenarioId !== undefined).toBe(true);
  });

  test("fallback cruelty path triggers from neglect keyword", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "animal neglect reported in backyard",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("cruelty");
    expect(res.scenarioId).toBe("fallback_cruelty");
    expect(res.dispatchProtocol).toBe("NOTIFY_ADMIN_AND_DISPATCH");
    expect(res.severity).toBe("high");
  });

  test("fallback accident path triggers from road keyword", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "injured dog lying on road after being hit",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("accident");
    expect(res.scenarioId).toBe("fallback_accident");
    expect(res.dispatchProtocol).toBe("DISPATCH_RESCUE_IMMEDIATELY");
    expect(res.severity).toBe("critical");
  });

  test("fallback sick path triggers from fever keyword", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "pet has fever and looks very weak",
    });

    expect(res.isEmergency).toBe(true);
    expect(res.classification).toBe("sick");
    expect(res.scenarioId).toBe("fallback_sick");
    expect(res.dispatchProtocol).toBe("SEND_HEALTH_ALERT");
    expect(res.severity).toBe("medium");
  });

  test("matchedKeywords defaults to empty array for fallback match", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "animal neglect case",
    });

    expect(res.matchedKeywords).toEqual([]);
  });

  test("returns unknown when both inputs are non-emergency text", () => {
    const res = detectEmergency({
      emergencyType: "General Help",
      description: "need appointment next week",
    });

    expect(res.classification).toBe("unknown");
    expect(res.isEmergency).toBe(false);
    expect(res.scenarioId).toBeNull();
  });

  test("forces fallback when no keywords but emergencyType exists", () => {
    const res = detectEmergency({
      emergencyType: "Unknown Type",
      description: "",
    });

    expect(res).toBeDefined();
  });

  test("forces fallback when description has weak keywords", () => {
    const res = detectEmergency({
      emergencyType: "",
      description: "pet situation unclear",
    });

    expect(res).toBeDefined();
  });

  test("forces branch when both inputs exist but no strong match", () => {
    const res = detectEmergency({
      emergencyType: "General",
      description: "animal situation but not severe",
    });

    expect(res.isEmergency).toBe(false);
  });

  test("forces edge case when severity logic does not match any condition", () => {
    const res = detectEmergency({
      emergencyType: "Random",
      description: "strange condition not mapped",
    });

    expect(res.severity).toBeDefined();
  });
});