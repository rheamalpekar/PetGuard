import AsyncStorage from "@react-native-async-storage/async-storage";

const EMERGENCY_KEY = "offline_emergencies";
const BOOKING_KEY = "offline_bookings";

// Per-key in-memory mutex: serializes concurrent read-modify-write operations
// so that rapid concurrent calls cannot lose queued items.
const queueLocks = new Map<string, Promise<void>>();

async function withQueueLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = queueLocks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  queueLocks.set(key, previous.then(() => next));

  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}

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
  await withQueueLock(EMERGENCY_KEY, async () => {
    const list = await getQueue<OfflineEmergency>(EMERGENCY_KEY);
    list.push(item);
    await setQueue(EMERGENCY_KEY, list);
  });
}

export async function queueBooking(item: OfflineBooking) {
  await withQueueLock(BOOKING_KEY, async () => {
    const list = await getQueue<OfflineBooking>(BOOKING_KEY);
    list.push(item);
    await setQueue(BOOKING_KEY, list);
  });
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