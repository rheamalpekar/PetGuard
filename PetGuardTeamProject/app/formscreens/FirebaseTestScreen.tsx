import { useState } from "react";
import { Text, TextInput, Button, View, StyleSheet } from "react-native";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../src/backendServices/firebase";

export default function FirebaseTestScreen() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    await createUserWithEmailAndPassword(auth, email, password);
    setMessage("Registration Successful");
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Login Successful");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <View style={styles.testScreen}>
      {/* <Text>{email}</Text>
      <Text>{password}</Text> */}
      {message && <Text>{message}</Text>}
      <TextInput
        style={styles.inputField}
        placeholder="email"
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.inputField}
        placeholder="password"
        secureTextEntry
        onChangeText={setPassword}
      />
      <View style={styles.buttonUI}>
        <Button
          onPress={register}
          title="Register (sends to firebase)"
          color="#042e71"
        />
      </View>
      <View style={styles.buttonUI}>
        <Button onPress={login} title="Login" color="#042e71" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inputField: {
    height: 40,
    borderWidth: 1,
    color: "gray",
    marginBottom: 10,
    paddingLeft: 10,
  },
  testScreen: {
    marginTop: 50,
  },
  buttonUI: {
    margin: 5,
  },
});
