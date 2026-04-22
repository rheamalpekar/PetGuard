import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  queueEmergency,
  queueBooking,
  getOfflineEmergencies,
  getOfflineBookings,
  clearOfflineEmergencies,
  clearOfflineBookings,
} from "../utils/offlineQueue";


describe("Offline Queue", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test("stores emergency offline", async () => {
    await queueEmergency({
      id: "1",
      emergencyType: "Accident",
      severity: "High",
      description: "dog hit",
      createdAt: new Date().toISOString(),
    });

    const data = await getOfflineEmergencies();

    expect(data.length).toBe(1);
    expect(data[0].emergencyType).toBe("Accident");
  });

  test("clears emergency queue", async () => {
    await queueEmergency({
      id: "1",
      emergencyType: "Accident",
      severity: "High",
      description: "dog hit",
      createdAt: new Date().toISOString(),
    });

    await clearOfflineEmergencies();
    const data = await getOfflineEmergencies();

    expect(data).toEqual([]);
  });

  test("handles empty emergency queue", async () => {
    const data = await getOfflineEmergencies();
    expect(data).toEqual([]);
  });

  test("stores multiple emergencies", async () => {
    await queueEmergency({
      id: "1",
      emergencyType: "A",
      severity: "Low",
      description: "test",
      createdAt: new Date().toISOString(),
    });

    await queueEmergency({
      id: "2",
      emergencyType: "B",
      severity: "High",
      description: "test",
      createdAt: new Date().toISOString(),
    });

    const data = await getOfflineEmergencies();
    expect(data.length).toBe(2);
    expect(data[1].emergencyType).toBe("B");
  });

  test("stores booking offline", async () => {
    await queueBooking({
      id: "10",
      service: "Vaccination",
      ownerName: "Pavan",
      petName: "Max",
      phone: "1234567890",
      date: "04/20/2026",
      notes: "Morning slot",
      gpsLocation: "Lat: 1, Lon: 2",
      createdAt: new Date().toISOString(),
    });

    const data = await getOfflineBookings();

    expect(data.length).toBe(1);
    expect(data[0].service).toBe("Vaccination");
    expect(data[0].ownerName).toBe("Pavan");
  });

  test("handles empty booking queue", async () => {
    const data = await getOfflineBookings();
    expect(data).toEqual([]);
  });

  test("stores multiple bookings", async () => {
    await queueBooking({
      id: "10",
      service: "Vaccination",
      ownerName: "Pavan",
      petName: "Max",
      phone: "1234567890",
      date: "04/20/2026",
      createdAt: new Date().toISOString(),
    });

    await queueBooking({
      id: "11",
      service: "Spay / Neuter",
      ownerName: "Sai",
      petName: "Luna",
      phone: "9999999999",
      date: "05/10/2026",
      createdAt: new Date().toISOString(),
    });

    const data = await getOfflineBookings();
    expect(data.length).toBe(2);
    expect(data[1].service).toBe("Spay / Neuter");
  });

  test("clears booking queue", async () => {
    await queueBooking({
      id: "10",
      service: "Vaccination",
      ownerName: "Pavan",
      petName: "Max",
      phone: "1234567890",
      date: "04/20/2026",
      createdAt: new Date().toISOString(),
    });

    await clearOfflineBookings();
    const data = await getOfflineBookings();

    expect(data).toEqual([]);
  });
});