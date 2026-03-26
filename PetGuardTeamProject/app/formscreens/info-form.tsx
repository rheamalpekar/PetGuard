import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { submitInfoForm } from "@/backendServices/ApiService";
import { useRouter } from "expo-router";

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


type LocationData = {
  latitude: number;
  longitude: number;
  address: string;
};

export type InfoFormData = {
  location: LocationData | null;
  yourName: string;
  phoneNumber: string;
  emailAddress: string;
  additionalDetails: string;
  formId: string;
};

type PhotoAsset = {
  uri?: string; // for mobile
  file?: File;  // for web
  type: 'image' | 'document';
  name?: string;
};

export default function InfoFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';

  const [hasTransportation, setHasTransportation] = useState<boolean | null>(null);
  const [transportationError, setTransportationError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const mapRef = useRef<any>(null);
  const router = useRouter();

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
      formId: '',
    },
  });

  useEffect(() => {
    // Skip map initialization on web
    if (isWeb) {
      return;
    }

    // Try to get user's location
    (async () => {
      setIsLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setMapRegion(newRegion);
        } else {
          Alert.alert(
            'Location Permission',
            'Location permission is needed to use the map. Please enable it in settings or manually tap on the map to set a location.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.log('Could not get initial location:', error);
        Alert.alert(
          'Location Error',
          'Could not get your location. Please tap on the map to set a location manually.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, [isWeb]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get your current location.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newPosition = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Reverse geocode to get address
      const address = await reverseGeocode(newPosition);
      setLocationAddress(address);

      // Update form
      setValue('location', {
        latitude: newPosition.latitude,
        longitude: newPosition.longitude,
        address,
      }, { shouldValidate: true });

      // Only update map on native platforms
      if (!isWeb) {
        setMarkerPosition(newPosition);
        setMapRegion({
          ...newPosition,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });

        // Animate map to new position
        mapRef.current?.animateToRegion({
          ...newPosition,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to get current location. Please try again.'
      );
      console.error('Location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const reverseGeocode = async (coords: { latitude: number; longitude: number }): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync(coords);
      if (result && result.length > 0) {
        const address = result[0];
        return [
          address.streetNumber,
          address.street,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    
    // Get address for the new position
    const address = await reverseGeocode({ latitude, longitude });
    setLocationAddress(address);
    
    // Update form
    setValue('location', {
      latitude,
      longitude,
      address,
    }, { shouldValidate: true });
  };

  const handleMarkerDragEnd = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerPosition({ latitude, longitude });
    
    // Get address for the new position
    const address = await reverseGeocode({ latitude, longitude });
    setLocationAddress(address);
    
    // Update form
    setValue('location', {
      latitude,
      longitude,
      address,
    }, { shouldValidate: true });
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      mediaTypes: ['images'],
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0] as ImagePicker.ImagePickerAsset & { file?: File };

      if (Platform.OS === "web") {
        setPhotos((prev) => [...prev, {
          file: asset.file,
          uri: asset.uri,
          type: 'image',
          name: asset.file?.name,
        }]);
      } else {
        setPhotos((prev) => [...prev, { uri: asset.uri, type: 'image', name: asset.fileName ?? undefined }]);
      }

      setPhotoError(null);
    }
  };

  const pickDocumentFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0] as DocumentPicker.DocumentPickerAsset & { file?: File };

        setPhotos((prev) => [
          ...prev,
          {
            uri: asset.uri,
            file: asset.file,
            type: 'document',
            name: asset.name,
          },
        ]);
        setPhotoError(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validateCustomFields = () => {
    let hasErrors = false;

    // Validate photos
    if (photos.length === 0) {
      setPhotoError('Please upload at least one photo');
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
    console.log("Form submission started", data);
    if (photos.length === 0) {
      console.log("Validation failed: No photos uploaded");
      setPhotoError("Please upload at least one photo.");
      return;
    }

    setIsSubmitting(true);
    setPhotoError(null);

    try {
      const photoInputs = photos.map((photo) => photo.file ?? photo.uri).filter(Boolean) as Array<File | string>;
      const response = await submitInfoForm(data, photoInputs);

      if (response.success) {
        console.log("Form submitted successfully", response);
        reset();
        setPhotos([]);
        router.replace({
          pathname: "/formscreens/ConfirmationPage",
          params: { formId: response.formId }
        });
      }
    } catch (error) {
      console.error("Error during form submission", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit the form. Please try again.";
      Alert.alert(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log("Form submission ended");
    }
  };

  const onSubmit = async (data: InfoFormData) => {
    // Double-check custom fields in case form fields were already valid
    if (!validateCustomFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Append location data
      if (data.location) {
        formDataToSend.append('latitude', String(data.location.latitude));
        formDataToSend.append('longitude', String(data.location.longitude));
        formDataToSend.append('address', data.location.address);
      }
      
      formDataToSend.append('yourName', data.yourName);
      formDataToSend.append('phoneNumber', data.phoneNumber);
      formDataToSend.append('emailAddress', data.emailAddress);
      formDataToSend.append('additionalDetails', data.additionalDetails);
      formDataToSend.append('hasTransportation', String(hasTransportation));

      // Append photos
      photos.forEach((photo, index) => {
        formDataToSend.append(`photos[${index}]`, {
          uri: photo.uri,
          type: 'image/jpeg',
          name: photo.name || `photo_${index}.jpg`,
        } as any);
      });

      // Replace with actual API endpoint
      const response = await fetch('https://api.com/submit-report', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const responseData = await response.json();
      
      Alert.alert('Success', 'Report submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            reset();
            setHasTransportation(null);
            setTransportationError(null);
            setPhotos([]);
            setPhotoError(null);
            setMarkerPosition(null);
            setLocationAddress('');
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit the form. Please try again.";
      Alert.alert(errorMessage);
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* Photo Documentation */}
      <View style={styles.section}>
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Photo Documentation</Text>
          <Text style={styles.requiredIndicator}>*</Text>
        </View>
        <View style={[styles.photoSection, photoError && styles.photoSectionError]}>
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.photoButton, styles.cameraButton]}
              onPress={pickImageFromCamera}
            >
              <Text style={styles.cameraButtonText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.photoButton, styles.filesButton]}
              onPress={pickDocumentFromFiles}
            >
              <Ionicons name="document-outline" size={16} color="#333" />
              <Text style={styles.filesButtonText}>Files</Text>
            </TouchableOpacity>
          </View>
          {photos.length > 0 && (
            <View style={styles.photoPreviewContainer}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoPreview}>
                  {photo.type === 'image' ? (
                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.documentPreview}>
                      <Ionicons name="document" size={24} color="#666" />
                      <Text style={styles.documentName} numberOfLines={1}>
                        {photo.name?.split('.').pop()?.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
        {photoError && (
          <Text style={styles.errorText}>{photoError}</Text>
        )}
      </View>

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
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
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
  photoSection: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
  },
  photoSectionError: {
    borderColor: '#ff4444',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
    gap: 6,
  },
  cameraButton: {
    backgroundColor: '#3478f6',
  },
  cameraButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  filesButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filesButtonText: {
    color: '#333',
    fontWeight: '500',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  photoPreview: {
    position: 'relative',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  documentPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentName: {
    fontSize: 8,
    color: '#666',
    maxWidth: 50,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
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
