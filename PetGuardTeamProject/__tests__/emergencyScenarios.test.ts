import { getScenarioCandidates } from "../src/emergency/core/emergencyScenarios";

describe("Scenario Matching", () => {
  test("matches accident keywords", () => {
    const res = getScenarioCandidates("dog hit by car");

    expect(res.length).toBeGreaterThan(0);
    expect(res.some((r) => r.classification === "accident")).toBe(true);
  });

  test("matches cruelty keywords", () => {
    const res = getScenarioCandidates("animal abuse case");

    expect(res.some((r) => r.classification === "cruelty")).toBe(true);
  });

  test("matches sick keywords", () => {
    const res = getScenarioCandidates("dog vomiting and weak");

    expect(res.some((r) => r.classification === "sick")).toBe(true);
  });

  test("no match case", () => {
    const res = getScenarioCandidates("hello world");

    expect(res).toEqual([]);
  });

  test("handles mixed keywords", () => {
    const res = getScenarioCandidates("dog injured and abused");

    expect(res.length).toBeGreaterThan(0);
  });

  test("handles empty string", () => {
    const res = getScenarioCandidates("");

    expect(res).toEqual([]);
  });
});