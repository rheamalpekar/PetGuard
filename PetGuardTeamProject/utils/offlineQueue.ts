import AsyncStorage from "@react-native-async-storage/async-storage";

const EMERGENCY_KEY = "offline_emergencies";
const BOOKING_KEY = "offline_bookings";

export type OfflineEmergency = {
  id: string;
  emergencyType: string;
  severity: string;
  description: string;
  location?: string;
  gpsLocation?: string;
  createdAt: string;
};

export type OfflineBooking = {
  id: string;
  service: string;
  ownerName: string;
  petName: string;
  phone: string;
  date: string;
  notes?: string;
  gpsLocation?: string;
  createdAt: string;
};

async function getQueue<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.log("Error reading queue:", key, e);
    return [];
  }
}

async function setQueue<T>(key: string, items: T[]) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.log("Error saving queue:", key, e);
  }
}

export async function queueEmergency(item: OfflineEmergency) {
  const list = await getQueue<OfflineEmergency>(EMERGENCY_KEY);
  list.push(item);
  await setQueue(EMERGENCY_KEY, list);
}

export async function queueBooking(item: OfflineBooking) {
  const list = await getQueue<OfflineBooking>(BOOKING_KEY);
  list.push(item);
  await setQueue(BOOKING_KEY, list);
}

export async function getOfflineEmergencies() {
  return getQueue<OfflineEmergency>(EMERGENCY_KEY);
}

export async function getOfflineBookings() {
  return getQueue<OfflineBooking>(BOOKING_KEY);
}

export async function clearOfflineEmergencies() {
  await AsyncStorage.removeItem(EMERGENCY_KEY);
}

export async function clearOfflineBookings() {
  await AsyncStorage.removeItem(BOOKING_KEY);
}