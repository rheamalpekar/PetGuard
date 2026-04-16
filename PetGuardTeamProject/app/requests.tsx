import { View, Text, FlatList, SafeAreaView } from "react-native";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/backendServices/firebase";
import { useAuth } from "@/context/AuthContext";
import { StyleSheet } from "react-native";

export default function RequestsScreen() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "infoForms"), where("uid", "==", user.uid));

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return unsub;
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, padding: 10, backgroundColor: "#0B1220" }}>
      <Text style={styles.text}>
        Requests (Dummy page to test the backend, delete later) {"\n\n"}
      </Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.text}>ID: {item.id}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Name: {item.yourName}</Text>
            <Text style={styles.text}>Email: {item.emailAddress}</Text>
            <Text style={styles.text}>Phone: {item.phoneNumber}</Text>
            <Text style={styles.text}>
              Description: {item.additionalDetails || "N/A"}
            </Text>
            <Text>{"\n"}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  text: { color: "#E5E7EB" },
});
