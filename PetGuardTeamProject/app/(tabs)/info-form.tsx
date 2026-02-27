import React, { useState } from 'react';
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
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';


type InfoFormData = {
  location: string;
  yourName: string;
  phoneNumber: string;
  emailAddress: string;
  additionalDetails: string;
};

type PhotoAsset = {
  uri: string;
  type: 'image' | 'document';
  name?: string;
};

export default function InfoFormScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [hasTransportation, setHasTransportation] = useState<boolean | null>(null);
  const [transportationError, setTransportationError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InfoFormData>({
    defaultValues: {
      location: '',
      yourName: '',
      phoneNumber: '',
      emailAddress: '',
      additionalDetails: '',
    },
  });

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
      setPhotos((prev) => [...prev, { uri: result.assets[0].uri, type: 'image' }]);
    }
  };

  const pickDocumentFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => [
          ...prev,
          {
            uri: result.assets[0].uri,
            type: 'document',
            name: result.assets[0].name,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: InfoFormData) => {
    // Validate transportation selection
    if (hasTransportation === null) {
      setTransportationError('Please select a transportation option');
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('location', data.location);
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

      // Replace with your actual API endpoint
      const response = await fetch('https://your-api.com/submit-report', {
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
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while submitting the report';
      Alert.alert('Submission Failed', errorMessage, [
        {
          text: 'OK',
        },
      ]);
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
        <Text style={[styles.label, { color: colors.text }]}>Location</Text>
        <Controller
          control={control}
          name="location"
          rules={{ required: 'Location is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                styles.input,
                styles.multilineInput,
                { color: colors.text, borderColor: errors.location ? '#ff4444' : '#ddd' },
              ]}
              placeholder=""
              placeholderTextColor={colors.icon}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              numberOfLines={3}
            />
          )}
        />
        {errors.location && (
          <Text style={styles.errorText}>{errors.location.message}</Text>
        )}
      </View>

      {/* Photo Documentation */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Photo Documentation</Text>
        <View style={styles.photoSection}>
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
      </View>

      {/* Contact Details */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Contact details</Text>
        <View style={styles.contactSection}>
          <Controller
            control={control}
            name="yourName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.contactInput, { color: colors.text }]}
                placeholder="Your name"
                placeholderTextColor={colors.icon}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="phoneNumber"
            rules={{
              pattern: {
                value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                message: 'Please enter a valid phone number',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.contactInput, { color: colors.text }]}
                placeholder="Phone number"
                placeholderTextColor={colors.icon}
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
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.contactInput, { color: colors.text }]}
                placeholder="Email address"
                placeholderTextColor={colors.icon}
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
        <Text style={[styles.label, { color: colors.text }]}>Transportation Availability</Text>
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
        onPress={handleSubmit(onSubmit)}
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
