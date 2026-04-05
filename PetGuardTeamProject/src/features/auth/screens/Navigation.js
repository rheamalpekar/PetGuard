import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config'; // adjust path to your firebase config

// ─── Screen Imports ───────────────────────────────────────────────────────────
// Import your screens here. Placeholders are provided for screens owned by
// other team members — swap in the real components when they're ready.

import HomeScreen from './HomeScreen';

// Placeholder components for screens handled by other team members.
// Replace these with the real imports once those screens are built:
const LoginScreen = () => null;         // → owned by teammate
const RegisterScreen = () => null;      // → owned by teammate
const ServiceDetailScreen = () => null; // → owned by teammate
const ReportScreen = () => null;        // → owned by teammate
const ProfileScreen = () => null;       // → owned by teammate

// ─── Navigator ────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

// ─── Theme ────────────────────────────────────────────────────────────────────

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1565C0',
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#212121',
    border: '#EEEEEE',
    notification: '#E53935',
  },
};

// ─── Shared Screen Options ────────────────────────────────────────────────────

const sharedScreenOptions = {
  headerStyle: { backgroundColor: '#FFFFFF' },
  headerTintColor: '#212121',
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 17,
  },
  headerBackTitleVisible: false,
  animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
  contentStyle: { backgroundColor: '#FAFAFA' },
};

const modalScreenOptions = {
  ...sharedScreenOptions,
  presentation: 'modal',
  animation: 'slide_from_bottom',
  headerShown: true,
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ ...sharedScreenOptions, headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// ─── App Stack ────────────────────────────────────────────────────────────────

const AppStack = () => (
  <Stack.Navigator screenOptions={sharedScreenOptions}>
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ServiceDetail"
      component={ServiceDetailScreen}
      options={({ route }) => ({
        title: formatServiceTitle(route.params.serviceType),
        ...sharedScreenOptions,
      })}
    />
    <Stack.Screen
      name="Report"
      component={ReportScreen}
      options={({ route }) => ({
        title: `Report: ${formatServiceTitle(route.params.serviceType)}`,
        ...modalScreenOptions,
      })}
    />
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ title: 'My Profile' }}
    />
  </Stack.Navigator>
);

// ─── Loading Screen ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator size="large" color="#1565C0" />
  </View>
);

// ─── NavigationController (Root) ──────────────────────────────────────────────

const NavigationController = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Firebase Auth state listener — auto-routes between Auth and App stacks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={AppTheme}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Returns a readable screen title for each service type
function formatServiceTitle(serviceType) {
  const titles = {
    emergency_rescue: 'Emergency Rescue',
    stray_report: 'Stray Animal',
    medical_assistance: 'Medical Assistance',
    animal_control: 'Animal Control',
    adoption: 'Adoption',
    wildlife: 'Wildlife',
  };
  return titles[serviceType] ?? 'Service';
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});

export default NavigationController;
