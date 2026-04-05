import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config'; // adjust path to your firebase config

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Service Definitions ──────────────────────────────────────────────────────

const SERVICE_CARDS = [
  {
    id: 'emergency_rescue',
    title: 'Emergency Rescue',
    description: 'Injured or trapped animal needing immediate help',
    icon: '🚨',
    color: '#FFFFFF',
    bgColor: '#E53935',
    isEmergency: true,
    badgeText: 'URGENT',
  },
  {
    id: 'stray_report',
    title: 'Stray Animal',
    description: 'Report a stray or lost pet in your area',
    icon: '🐾',
    color: '#1A237E',
    bgColor: '#E3F2FD',
    isEmergency: false,
  },
  {
    id: 'medical_assistance',
    title: 'Medical Help',
    description: 'Animal showing signs of illness or injury',
    icon: '🏥',
    color: '#FFFFFF',
    bgColor: '#F57C00',
    isEmergency: true,
    badgeText: 'PRIORITY',
  },
  {
    id: 'animal_control',
    title: 'Animal Control',
    description: 'Dangerous or aggressive animal situation',
    icon: '🛡️',
    color: '#FFFFFF',
    bgColor: '#6A1B9A',
    isEmergency: true,
    badgeText: 'URGENT',
  },
  {
    id: 'adoption',
    title: 'Adoption',
    description: 'Find a loving home for an animal',
    icon: '❤️',
    color: '#1B5E20',
    bgColor: '#E8F5E9',
    isEmergency: false,
  },
  {
    id: 'wildlife',
    title: 'Wildlife',
    description: 'Wild animal in distress or out of habitat',
    icon: '🦅',
    color: '#4E342E',
    bgColor: '#EFEBE9',
    isEmergency: false,
  },
];

// ─── Emergency Banner ─────────────────────────────────────────────────────────

const EmergencyBanner = ({ pulseAnim }) => {
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  return (
    <Animated.View style={[styles.emergencyBanner, { transform: [{ scale }] }]}>
      <Text style={styles.emergencyIcon}>⚡</Text>
      <View style={styles.emergencyTextContainer}>
        <Text style={styles.emergencyTitle}>ANIMAL IN DANGER?</Text>
        <Text style={styles.emergencySubtitle}>
          Tap Emergency Rescue for immediate dispatch
        </Text>
      </View>
      <View style={styles.emergencyDot} />
    </Animated.View>
  );
};

// ─── Service Card ─────────────────────────────────────────────────────────────

const ServiceCardItem = ({ card, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: card.bgColor }]}
        onPress={() => onPress(card.id)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {card.isEmergency && card.badgeText && (
          <View
            style={[
              styles.emergencyBadge,
              { backgroundColor: card.bgColor === '#E53935' ? '#B71C1C' : '#E53935' },
            ]}
          >
            <Text style={styles.emergencyBadgeText}>{card.badgeText}</Text>
          </View>
        )}
        <Text style={styles.cardIcon}>{card.icon}</Text>
        <Text style={[styles.cardTitle, { color: card.color }]}>{card.title}</Text>
        <Text
          style={[
            styles.cardDescription,
            { color: card.color, opacity: card.isEmergency ? 0.85 : 0.65 },
          ]}
          numberOfLines={2}
        >
          {card.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────

const HomeScreen = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Pull user info from Firebase Auth
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email ?? '');
      const displayName = user.displayName ?? user.email?.split('@')[0] ?? 'User';
      setUserName(displayName);
    }
  }, []);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Emergency banner pulse loop
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PetGuard?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await signOut(auth);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleServicePress = (serviceId) => {
    navigation.navigate('ServiceDetail', { serviceType: serviceId });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{userEmail}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutIcon}>⎋</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Emergency Banner */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <EmergencyBanner pulseAnim={pulseAnim} />
        </Animated.View>

        {/* Section Title */}
        <Animated.View
          style={[
            styles.sectionHeader,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.sectionTitle}>How can we help?</Text>
          <Text style={styles.sectionSubtitle}>Select a service to get started</Text>
        </Animated.View>

        {/* Service Cards Grid */}
        <Animated.View
          style={[
            styles.cardsGrid,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {SERVICE_CARDS.map((card) => (
            <ServiceCardItem
              key={card.id}
              card={card}
              onPress={handleServicePress}
            />
          ))}
        </Animated.View>

        <Text style={styles.footer}>PetGuard • Protecting Animals Together</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#1565C0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212121',
    maxWidth: width * 0.45,
  },
  userEmail: {
    fontSize: 11,
    color: '#BDBDBD',
    maxWidth: width * 0.45,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  logoutIcon: {
    fontSize: 18,
    color: '#757575',
  },
  emergencyBanner: {
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#B71C1C',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#B71C1C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  emergencyIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  emergencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#212121',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#9E9E9E',
    marginTop: 2,
    fontWeight: '500',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  emergencyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  cardDescription: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  footer: {
    textAlign: 'center',
    marginTop: 28,
    fontSize: 11,
    color: '#BDBDBD',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;
