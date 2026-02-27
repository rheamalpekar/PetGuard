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
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);

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
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, { uri: result.assets[0].uri, type: 'image' }]);
    }
  };

  const pickDocumentFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
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
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: InfoFormData) => {
    const formData = {
      ...data,
      hasTransportation,
      photos,
    };

    console.log('Form submitted:', formData);
    Alert.alert('Success', 'Report submitted successfully!', [
      {
        text: 'OK',
        onPress: () => {
          reset();
          setHasTransportation(null);
          setPhotos([]);
        },
      },
    ]);
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
                        {photo.name}
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
          <Controller
            control={control}
            name="emailAddress"
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
        </View>
      </View>

      {/* Transportation Availability */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>Transportation Availability</Text>
        <View style={styles.transportSection}>
          <View style={styles.transportButtons}>
            <TouchableOpacity
              style={[
                styles.transportButton,
                hasTransportation === true && styles.transportButtonActive,
              ]}
              onPress={() => setHasTransportation(true)}
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
              onPress={() => setHasTransportation(false)}
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
        style={styles.submitButton}
        onPress={handleSubmit(onSubmit)}
      >
        <Text style={styles.submitButtonText}>Submit Report</Text>
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
