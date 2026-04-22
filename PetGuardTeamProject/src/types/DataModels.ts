// pulled as is from everyone's code to store together

import type { User } from "firebase/auth";

export const REQUEST_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in-progress",
  RESOLVED: "resolved",
} as const;

export const PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const EMERGENCY_CLASSIFICATION = {
  SICK: "sick",
  ACCIDENT: "accident",
  CRUELTY: "cruelty",
  UNKNOWN: "unknown",
} as const;

export const SERVICE_CATEGORY = {
  EMERGENCY: "emergency",
  NON_EMERGENCY: "non-emergency",
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];
export type PriorityLevel = (typeof PRIORITY)[keyof typeof PRIORITY];
export type EmergencyClassification =
  (typeof EMERGENCY_CLASSIFICATION)[keyof typeof EMERGENCY_CLASSIFICATION];
export type ServiceCategory =
  (typeof SERVICE_CATEGORY)[keyof typeof SERVICE_CATEGORY];

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type LocationData = Coordinates & {
  address: string;
};

export type InfoFormData = {
  formId?: string;
  location: LocationData | null;
  yourName: string;
  phoneNumber: string;
  emailAddress: string;
  additionalDetails: string;
  emergencyContext?: EmergencyContext;
  serviceType: string;
  severity: string;
};

export type ConfirmationDisplayData = InfoFormData | {
  yourName: string;
  phoneNumber: string;
  emailAddress: string;
  additionalDetails: string;
  location: string;
};

export type PhotoAsset = {
  uri: string;
  type: "image" | "document";
  name?: string;
  // file?: string | Blob | File;
};

export type UploadablePhoto = string | Blob | File;

export type QueuedInfoForm = {
  localId: string;
  uid: string;
  data: InfoFormData;
  photoUris: string[];
  createdAt: number;
  retryCount: number;
};

export type ServiceRequest = {
  id?: string;
  formId?: string;
  uid: string;
  yourName?: string;
  name?: string;
  phoneNumber?: string;
  phone?: string;
  emailAddress?: string;
  additionalDetails?: string;
  description?: string;
  location: LocationData | string | Coordinates | null;
  photos?: string[];
  priority?: PriorityLevel;
  status: RequestStatus;
  createdAt: Date | { toDate?: () => Date };
};

export type UserProfile = {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber?: string | number;
  dateOfBirth?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type UserProfileUpdate = Partial<
  Pick<UserProfile, "fullName" | "phoneNumber" | "dateOfBirth">
>;

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  justSynced: boolean;
  isOnline: boolean;
  hadPendingQueue: boolean;
  isGuest: boolean;
  continueAsGuest: () => Promise<User>;
};

export type EmergencyScenario = {
  id: string;
  title?: string;
  keywords: string[];
  severity: PriorityLevel;
  classification: EmergencyClassification;
  isEmergency: boolean;
  checklist?: string[];
  dispatchProtocol?: string;
  requiredFields?: string[];
  responseTimeEstimateMin?: number;
};

export type EmergencyDetectionInput = {
  emergencyType: string;
  description: string;
};

export type EmergencyDetectionResult = {
  isEmergency: boolean;
  severity: PriorityLevel;
  classification: EmergencyClassification;
  scenarioId: string | null;
  checklist: string[];
  dispatchProtocol: string;
  countdownSeconds: number;
  detectionMs: number;
  matchedKeywords: string[];
};

export type EmergencyReportSeverityUI = "Low" | "Medium" | "High";

export type EmergencyContext = {
  emergencyType?: string;
  description?: string;
  severity?: string;
  classification?: string;
  scenarioId?: string | null;
  dispatchProtocol?: string;
  checklist?: string[];
  countdownSeconds?: number;
};

export type EmergencyReportData = {
  type: string;
  severity: EmergencyReportSeverityUI | PriorityLevel | string;
  description: string;
  location?: string;
};

export type ApiSuccessResponse = {
  success: true;
  id?: string;
  formId?: string;
};
