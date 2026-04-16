export interface ServiceRequest {
  id?: string;
  uid: string;
  name: string;
  phone: string;
  description: string;
  location: { lat: number; lng: number };
  photos?: string[];
  priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in-progress" | "resolved";
  createdAt: Date;
}


// User model


// Response model, etc