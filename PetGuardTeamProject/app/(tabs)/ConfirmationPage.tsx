import { Text, TextInput, Button, View, StyleSheet } from "react-native";

export default function InformationCollection() {
  return (
    <View>
      <View>
        <Text style={[styles.heading,styles.text]}>Request Submitted Successfully</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Request Id</Text>
        <Text style={styles.text}>9378226432188</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Estimated Response Time</Text>
        <Text style={styles.text}>1hr</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.text}>Contact information Detail</Text>
        <View style={styles.section}>
          <Text style={styles.text}>Name</Text>
          <Text style={styles.text}>Alan Smith</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Email</Text>
          <Text style={styles.text}>alan.smith@gmail.com</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Phone Number</Text>
          <Text style={styles.text}>(937)-822-6432</Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.text}>Location</Text>
          <Text style={styles.text}>Arlington, Tx</Text>
        </View>
      </View>
      <View>
        <Button
          onPress={()=>console.log("Button pressed")}
          title="Back to Home Page"
          color="#158445"
        />
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  text:{
    color:"white",
  },
  section:{
    backgroundColor: "#545556",
    margin:8,
    padding:10
  },
  heading:{
    fontSize:18,
    fontWeight:600
  }
});