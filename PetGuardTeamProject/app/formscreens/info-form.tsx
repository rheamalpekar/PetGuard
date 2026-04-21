import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';
import * as LocationService from '../../services/LocationService';
import { Colors } from '@/constants/theme';
import { AccuracyLevel } from '../../services/LocationService';
import { useColorScheme } from '@/hooks/use-color-scheme';
import PhotoUploadComponent from '@/components/PhotoUploadComponent';
import { auth } from "@/backendServices/firebase";
import {
  enqueueInfoForm,
  submitInfoForm,
} from "@/backendServices/ApiService";
import { RateLimitError } from "@/backendServices/RateLimiter";
import type { InfoFormData, LocationData, PhotoAsset } from "@/types/DataModels";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import DisclaimerText from '@/components/DisclaimerText';

// Conditionally import MapView only on mobile platforms
let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
}

type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};


type PhotoUploadHandle = {
  getPhotos: () => PhotoAsset[];
  validate: () => boolean;
  reset: () => void;
};

type PhotoUploadProps = {
  colors: { text: string; icon: string };
  isUploading?: boolean;
  uploadProgress?: number;
};

export default function InfoFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';
  const router = useRouter();

  const [hasTransportation, setHasTransportation] = useState<boolean | null>(null);
  const [transportationError, setTransportationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [locationAccuracy, setLocationAccuracy] = useState<{
    level: string;
    description: string;
    meters: number | null;
  } | null>(null);
  const mapRef = useRef<any>(null);
  const photoUploadRef = useRef<PhotoUploadHandle>(null);
  const submitLockRef = useRef(false);
  const TypedPhotoUploadComponent =
    PhotoUploadComponent as React.ForwardRefExoticComponent<
      PhotoUploadProps & React.RefAttributes<PhotoUploadHandle>
    >;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InfoFormData>({
    mode: 'onBlur',
    defaultValues: {
      location: null,
      yourName: '',
      phoneNumber: '',
      emailAddress: '',
      additionalDetails: '',
    },
  });

  useEffect(() => {
    // Initialize location on mount
    LocationService.initializeLocation(
      { setMapRegion, setIsLoadingLocation },
      isWeb
    );
  }, [isWeb]);

  const getCurrentLocation = () => {
    LocationService.getCurrentLocationWithAddress({
      setIsLoadingLocation,
      setLocationAddress,
      setValue,
      setMarkerPosition,
      setMapRegion,
      mapRef,
      isWeb,
      setLocationAccuracy
    });
  };

  const handleMapPress = (event: any) => {
    // Clear GPS-derived location accuracy when user manually selects a location
    setLocationAccuracy(null);

    LocationService.handleMapPress(event, {
      setMarkerPosition,
      setLocationAddress,
      setValue
    });
  };

  const handleMarkerDragEnd = (event: any) => {
    LocationService.handleMarkerDragEnd(event, {
      setMarkerPosition,
      setLocationAddress,
      setValue
    });
    // Clear any previous GPS-based accuracy when the user manually adjusts the marker
    setLocationAccuracy(null);
  };

  const validateCustomFields = () => {
    let hasErrors = false;

    const photosValid = photoUploadRef.current?.validate() ?? false;
    if (!photosValid) {
      hasErrors = true;
    }

    // Validate transportation selection
    if (hasTransportation === null) {
      setTransportationError('Please select a transportation option');
      hasErrors = true;
    }

    return !hasErrors;
  };

  const handleFormSubmit = async (data: InfoFormData) => {
    setRateLimitErrorMessage(null);
    if (submitLockRef.current) {
      return;
    }

    if (!validateCustomFields()) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const netState = await NetInfo.fetch();

      const isOnline = netState.isConnected === true && netState.isInternetReachable === true;
      console.log("isOnline FIXED:", isOnline, netState);

      if (!isOnline) {
        const localId = `queued_${Date.now()}`;

        const photos = photoUploadRef.current?.getPhotos() ?? [];

        const photoUris = photos
          .map((p) => p.uri)
          .filter((uri): uri is string => Boolean(uri));

        await enqueueInfoForm({
          localId,
          uid: user.uid,
          data: {
            ...data,
            formId: localId,
          },
          photoUris,
          createdAt: Date.now(),
          retryCount: 0,
        });

        reset();
        photoUploadRef.current?.reset();
        setIsSubmitting(false);

        router.push({
          pathname: "/formscreens/ConfirmationPage",
          params: { formId: localId },
        });

        return;
      }

      const photos = photoUploadRef.current?.getPhotos() ?? [];

      const photoInputs = photos
        .map((p: any) => p.file ?? p.uri)
        .filter(Boolean);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 8000)
      );

      const response: any = await Promise.race([
        submitInfoForm(data, photoInputs),
        timeoutPromise,
      ]);

      if (response.success) {
        reset();
        photoUploadRef.current?.reset();

        router.push({
          pathname: "/formscreens/ConfirmationPage",
          params: { formId: response.formId },
        });
      }
    } catch (error: any) {
      console.log("FORCED OFFLINE FALLBACK", error);

      if (error instanceof RateLimitError) {
        setRateLimitErrorMessage(
          `Too many submissions. Please try again in ${error.retryAfterSeconds} seconds.`,
        );
        return;
      }

      const localId = `queued_${Date.now()}`;
      const photos = photoUploadRef.current?.getPhotos() ?? [];

      const photoUris = photos
        .map((p: any) => p.uri)
        .filter((uri: any): uri is string => Boolean(uri));

      await enqueueInfoForm({
        localId,
        uid: user.uid,
        data: {
          ...data,
          formId: localId,
        },
        photoUris,
        createdAt: Date.now(),
        retryCount: 0,
      });

      reset();
      photoUploadRef.current?.reset();

      router.push({
        pathname: "/formscreens/ConfirmationPage",
        params: { formId: localId },
      });
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const [rateLimitErrorMessage, setRateLimitErrorMessage] = useState<string | null>(null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Location */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Location</Text>
          <Text style={styles.requiredIndicator}>*</Text>
        </View>
        
        {isWeb ? (
          // Web: Show text input with description (For dev purposes)
          <>
            <Text style={[styles.helpText, { color: colors.icon }]}>
              Enter an address or use the button below to auto-detect your location
            </Text>
            <Controller
              control={control}
              name="location"
              rules={{ required: 'Location is required' }}
              render={({ field: { value } }) => (
                <>
                  <View style={styles.webLocationInputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.multilineInput,
                        { 
                          color: colors.text, 
                          borderColor: errors.location ? '#ff4444' : '#ddd',
                          backgroundColor: isLoadingLocation ? '#f8f8f8' : '#fff',
                        },
                      ]}
                      placeholder="Enter address or coordinates"
                      placeholderTextColor={colors.icon}
                      value={locationAddress}
                      onChangeText={(text) => {
                        setLocationAddress(text);
                        // For web, we'll just store the text as address
                        setValue('location', {
                          latitude: 0,
                          longitude: 0,
                          address: text,
                        }, { shouldValidate: true });
                      }}
                      multiline
                      numberOfLines={3}
                      editable={!isLoadingLocation}
                    />
                    {isLoadingLocation && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="small" color="#3478f6" />
                        <Text style={styles.loadingText}>Getting location...</Text>
                      </View>
                    )}
                  </View>
                  {value && (value.latitude !== 0 || value.longitude !== 0) && (
                    <View style={styles.addressContainer}>
                      <Ionicons name="checkmark-circle" size={16} color="#34c759" />
                      <Text style={styles.addressText}>
                        Location detected: {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            />
          </>
        ) : (
          // Native: Show interactive map
          <>
            <Text style={[styles.helpText, { color: colors.icon }]}>
              Tap on the map to set location, or use the button below to auto-detect
            </Text>
            <Controller
              control={control}
              name="location"
              rules={{ required: 'Please select a location on the map' }}
              render={({ field: { value } }) => (
                <View style={[styles.mapContainer, errors.location && styles.mapContainerError]}>
                  {mapRegion ? (
                    <>
                      <MapView
                        ref={mapRef}
                        style={styles.map}
                        region={mapRegion}
                        onPress={handleMapPress}
                        showsUserLocation
                        showsMyLocationButton={false}
                      >
                        {markerPosition && (
                          <Marker
                            coordinate={markerPosition}
                            draggable
                            onDragEnd={handleMarkerDragEnd}
                          >
                            <View style={styles.customMarker}>
                              <Ionicons name="location" size={40} color="#ff4444" />
                            </View>
                          </Marker>
                        )}
                      </MapView>
                      {isLoadingLocation && (
                        <View style={styles.mapLoadingOverlay}>
                          <View style={styles.mapLoadingContainer}>
                            <ActivityIndicator size="large" color="#3478f6" />
                            <Text style={styles.mapLoadingText}>Getting your location...</Text>
                          </View>
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.mapLoadingOverlay}>
                      <View style={styles.mapLoadingContainer}>
                        <ActivityIndicator size="large" color="#3478f6" />
                        <Text style={styles.mapLoadingText}>Loading map...</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            />
            {locationAddress !== '' && (
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.addressText}>{locationAddress}</Text>
              </View>
            )}
            {locationAccuracy && (
              <View style={[
                styles.accuracyContainer,
                locationAccuracy.level === AccuracyLevel.HIGH && styles.accuracyHigh,
                locationAccuracy.level === AccuracyLevel.MEDIUM && styles.accuracyMedium,
                locationAccuracy.level === AccuracyLevel.LOW && styles.accuracyLow,
                locationAccuracy.level === AccuracyLevel.VERY_LOW && styles.accuracyVeryLow,
              ]}>
                <Ionicons 
                  name="radio" 
                  size={16} 
                  color={
                    locationAccuracy.level === AccuracyLevel.HIGH ? '#34c759' :
                    locationAccuracy.level === AccuracyLevel.MEDIUM ? '#5ac8fa' :
                    locationAccuracy.level === AccuracyLevel.LOW ? '#ff9500' :
                    '#ff3b30'
                  } 
                />
                <Text style={styles.accuracyText}>
                  {locationAccuracy.description}
                  {locationAccuracy.meters != null && ` (±${Math.round(locationAccuracy.meters)}m)`}
                </Text>
              </View>
            )}
          </>
        )}
        
        <View style={styles.locationActions}>
          <TouchableOpacity
            style={[styles.gpsButton, isLoadingLocation && styles.gpsButtonDisabled]}
            onPress={getCurrentLocation}
            disabled={isLoadingLocation}
          >
            <Ionicons name="navigate" size={18} color="#fff" />
            <Text style={styles.gpsButtonText}>
              {isLoadingLocation ? 'Locating...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>
        </View>
        {errors.location && (
          <Text style={styles.errorText}>{errors.location.message}</Text>
        )}
      </View>

      <TypedPhotoUploadComponent
        ref={photoUploadRef}
        colors={colors}
        isUploading={isSubmitting}
        uploadProgress={uploadProgress}
      />

      {/* Contact Details */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Contact details</Text>
          <Text style={styles.requiredIndicator}>*</Text>
        </View>
        <View style={styles.contactSection}>
          <Controller
            control={control}
            name="yourName"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.contactInput,
                  { color: colors.text, borderBottomColor: errors.yourName ? '#ff4444' : '#eee' },
                ]}
                placeholder="Your name"
                placeholderTextColor={colors.icon}
                onFocus={() => {
                  if (hasTransportation === null) {
                    setTransportationError('Please select a transportation option');
                  }
                }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.yourName && (
            <Text style={styles.errorText}>{errors.yourName.message}</Text>
          )}
          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              required: 'Phone number is required',
              pattern: {
                value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                message: 'Please enter a valid phone number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.contactInput,
                  { color: colors.text, borderBottomColor: errors.phoneNumber ? '#ff4444' : '#eee' },
                ]}
                placeholder="Phone number"
                placeholderTextColor={colors.icon}
                onFocus={() => {
                  if (hasTransportation === null) {
                    setTransportationError('Please select a transportation option');
                  }
                }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
              />
            )}
          />
          {errors.phoneNumber && (
            <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
          )}
          <Controller
            control={control}
            name="emailAddress"
            rules={{
              required: 'Email address is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.contactInput,
                  { color: colors.text, borderBottomColor: errors.emailAddress ? '#ff4444' : '#eee' },
                ]}
                placeholder="Email address"
                placeholderTextColor={colors.icon}
                onFocus={() => {
                  if (hasTransportation === null) {
                    setTransportationError('Please select a transportation option');
                  }
                }}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
          />
          {errors.emailAddress && (
            <Text style={styles.errorText}>{errors.emailAddress.message}</Text>
          )}
        </View>
      </View>

      {/* Transportation Availability */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Transportation Availability</Text>
          <Text style={styles.requiredIndicator}>*</Text>
        </View>
        <View style={[styles.transportSection, transportationError && styles.transportSectionError]}>
          <View style={styles.transportButtons}>
            <TouchableOpacity
              style={[
                styles.transportButton,
                hasTransportation === true && styles.transportButtonActive,
              ]}
              onPress={() => {
                setHasTransportation(true);
                setTransportationError(null);
              }}
            >
              <Text
                style={[
                  styles.transportButtonText,
                  hasTransportation === true && styles.transportButtonTextActive,
                ]}
              >
                YES
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.transportButton,
                hasTransportation === false && styles.transportButtonActive,
              ]}
              onPress={() => {
                setHasTransportation(false);
                setTransportationError(null);
              }}
            >
              <Text
                style={[
                  styles.transportButtonText,
                  hasTransportation === false && styles.transportButtonTextActive,
                ]}
              >
                NO
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {transportationError && (
          <Text style={styles.errorText}>{transportationError}</Text>
        )}
      </View>

      {/* Additional Details */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Additional Details</Text>
        <Controller
          control={control}
          name="additionalDetails"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                { color: colors.text },
              ]}
              placeholder=""
              placeholderTextColor={colors.icon}
              onFocus={() => {
                if (hasTransportation === null) {
                  setTransportationError('Please select a transportation option');
                }
              }}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={4}
            />
          )}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={() => {
          console.log("BUTTON PRESSED");
          handleSubmit(handleFormSubmit)();
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
      {rateLimitErrorMessage && (
        <Text style={styles.rateLimitText}>
          {rateLimitErrorMessage}
        </Text>
      )}
      <DisclaimerText />
    </ScrollView>
  );
}

// Styles made by ChatGPT based on the design in Figma. Adjust as needed for better UI/UX.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  requiredIndicator: {
    color: '#ff4444',
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  webLocationInputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 8,
  },
  loadingText: {
    color: '#3478f6',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  mapContainerError: {
    borderColor: '#ff4444',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapLoadingContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapLoadingText: {
    marginTop: 12,
    color: '#3478f6',
    fontSize: 14,
    fontWeight: '500',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  accuracyHigh: {
    backgroundColor: '#e8f9ef',
    borderWidth: 1,
    borderColor: '#c3f1d1',
  },
  accuracyMedium: {
    backgroundColor: '#e6f7fc',
    borderWidth: 1,
    borderColor: '#b8e8f9',
  },
  accuracyLow: {
    backgroundColor: '#fff4e6',
    borderWidth: 1,
    borderColor: '#ffe0b8',
  },
  accuracyVeryLow: {
    backgroundColor: '#ffe6e6',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  accuracyText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3478f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  rateLimitText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  contactSection: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  contactInput: {
    padding: 14,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
  },
  transportSection: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  transportSectionError: {
    borderColor: '#ff4444',
  },
  transportButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  transportButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  transportButtonActive: {
    backgroundColor: '#3478f6',
    borderColor: '#3478f6',
  },
  transportButtonText: {
    fontWeight: '500',
    color: '#333',
  },
  transportButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#3478f6',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export type { InfoFormData } from "@/types/DataModels";
