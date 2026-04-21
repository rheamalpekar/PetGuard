import {
  CLASSIFICATION,
  getScenarioCandidates,
} from "../src/emergency/core/emergencyScenarios";

describe("getScenarioCandidates", () => {
  it("classifies accident keywords", () => {
    const matches = getScenarioCandidates("Dog was hit by a car on the road");

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "road_accident",
          classification: CLASSIFICATION.ACCIDENT,
          isEmergency: true,
        }),
      ]),
    );
  });

  it("classifies cruelty keywords", () => {
    const matches = getScenarioCandidates(
      "Animal cruelty and neglect reported",
    );

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "animal_cruelty",
          classification: CLASSIFICATION.CRUELTY,
        }),
      ]),
    );
  });

  it("classifies sick animal keywords", () => {
    const matches = getScenarioCandidates("Cat is sick and vomiting");

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "sick_animal",
          classification: CLASSIFICATION.SICK,
        }),
      ]),
    );
  });

  it("returns multiple matches for mixed descriptions", () => {
    const matches = getScenarioCandidates(
      "Dog was hit by a truck and appears sick after abuse",
    );

    expect(matches.map((match) => match.classification)).toEqual(
      expect.arrayContaining([
        CLASSIFICATION.ACCIDENT,
        CLASSIFICATION.CRUELTY,
        CLASSIFICATION.SICK,
      ]),
    );
  });

  it("returns an empty list for empty input", () => {
    expect(getScenarioCandidates("")).toEqual([]);
    expect(getScenarioCandidates("   ")).toEqual([]);
  });

  it("returns an empty list when there are no scenario matches", () => {
    expect(getScenarioCandidates("general grooming appointment")).toEqual([]);
  });
});
