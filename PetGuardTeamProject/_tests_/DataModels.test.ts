import {
  EMERGENCY_CLASSIFICATION,
  PRIORITY,
  REQUEST_STATUS,
  SERVICE_CATEGORY,
  type EmergencyDetectionResult,
  type InfoFormData,
  type QueuedInfoForm,
} from "../src/types/DataModels";

describe("DataModels", () => {
  test("exports shared request and emergency constants", () => {
    expect(REQUEST_STATUS.PENDING).toBe("pending");
    expect(PRIORITY.CRITICAL).toBe("critical");
    expect(EMERGENCY_CLASSIFICATION.ACCIDENT).toBe("accident");
    expect(SERVICE_CATEGORY.NON_EMERGENCY).toBe("non-emergency");
  });

  test("supports the info form and offline queue shapes", () => {
    const formData: InfoFormData = {
      formId: "queued_1",
      location: {
        latitude: 32.7357,
        longitude: -97.1081,
        address: "Arlington, TX",
      },
      yourName: "Test User",
      phoneNumber: "1234567890",
      emailAddress: "test@petguard.app",
      additionalDetails: "Needs help",
    };

    const queued = {
      localId: "queued_1",
      uid: "user_1",
      data: formData,
      photoUris: ["photo.jpg"],
      createdAt: 1000,
      retryCount: 0,
    } satisfies QueuedInfoForm;

    expect(queued.data.location?.address).toBe("Arlington, TX");
  });

  test("supports emergency detection response shape", () => {
    const result = {
      isEmergency: true,
      severity: PRIORITY.HIGH,
      classification: EMERGENCY_CLASSIFICATION.SICK,
      scenarioId: "sick_animal",
      checklist: [],
      dispatchProtocol: "TRIAGE",
      countdownSeconds: 20,
      detectionMs: 5,
    } satisfies EmergencyDetectionResult;

    expect(result.isEmergency).toBe(true);
  });
});
