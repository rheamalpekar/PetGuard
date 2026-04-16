import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';

function ensureJpgName(name, fallbackIndex) {
  if (!name) {
    return `photo_${fallbackIndex}.jpg`;
  }

  const baseName = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
  return `${baseName}.jpg`;
}

const PhotoUploadComponent = forwardRef(function PhotoUploadComponent(
  { colors, isUploading = false, uploadProgress = 0 },
  ref
) {
  const [photos, setPhotos] = useState([]);
  const [photoError, setPhotoError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isBusy = isUploading || isProcessing;

  const compressAssets = async (assets, photoType) => {
    if (!assets?.length) {
      return;
    }

    setIsProcessing(true);

    try {
      const processedPhotos = await Promise.all(
        assets.map(async (asset, index) => {
          const compressed = await ImageManipulator.manipulateAsync(
            asset.uri,
            [],
            {
              compress: 0.65,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          const fileName = ensureJpgName(asset.name, Date.now() + index);
          const photo = {
            uri: compressed.uri,
            type: photoType,
            name: fileName,
          };

          if (Platform.OS === 'web') {
            try {
              const response = await fetch(compressed.uri);
              if (!response.ok) {
                throw new Error(`Failed to fetch compressed image: ${response.status}`);
              }
              // Always use 'image/jpeg' MIME type since we compress to JPEG regardless of source.
              photo.blob = new File([await response.blob()], fileName, { type: 'image/jpeg' });
            } catch (blobError) {
              throw new Error('Could not convert image for upload. Please try again.');
            }
          }

          return photo;
        })
      );

      setPhotos((prev) => [...prev, ...processedPhotos]);
      setPhotoError(null);
    } catch (error) {
      Alert.alert('Error', 'Could not process selected image(s). Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets?.length) {
      await compressAssets(result.assets, 'image');
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Photo library access is needed to select images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 0,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets?.length) {
      await compressAssets(result.assets, 'image');
    }
  };

  const pickDocumentFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets?.length) {
        await compressAssets(result.assets, 'document');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from files.');
    }
  };

  const removePhoto = (index) => {
    setPhotos((prev) => {
      const nextPhotos = prev.filter((_, i) => i !== index);
      if (nextPhotos.length > 0) {
        setPhotoError(null);
      }
      return nextPhotos;
    });
  };

  const validate = () => {
    if (photos.length === 0) {
      setPhotoError('Please upload at least one photo');
      return false;
    }

    setPhotoError(null);
    return true;
  };

  const reset = () => {
    setPhotos([]);
    setPhotoError(null);
  };

  useImperativeHandle(ref, () => ({
    getPhotos: () => photos,
    validate,
    reset,
  }));

  return (
    <View style={styles.section}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Photo Documentation</Text>
        <Text style={styles.requiredIndicator}>*</Text>
      </View>

      <Text style={[styles.helpText, { color: colors.icon }]}>Add one or more photos from camera, gallery, or files</Text>

      <View style={[styles.photoSection, photoError && styles.photoSectionError]}>
        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={[styles.photoButton, styles.cameraButton, isBusy && styles.buttonDisabled]}
            onPress={pickImageFromCamera}
            disabled={isBusy}
          >
            <Ionicons name="camera-outline" size={16} color="#fff" />
            <Text style={styles.cameraButtonText}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoButton, styles.galleryButton, isBusy && styles.buttonDisabled]}
            onPress={pickFromGallery}
            disabled={isBusy}
          >
            <Ionicons name="images-outline" size={16} color="#333" />
            <Text style={styles.filesButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.photoButton, styles.filesButton, isBusy && styles.buttonDisabled]}
            onPress={pickDocumentFromFiles}
            disabled={isBusy}
          >
            <Ionicons name="document-outline" size={16} color="#333" />
            <Text style={styles.filesButtonText}>Files</Text>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#3478f6" />
            <Text style={styles.processingText}>Compressing selected image(s)...</Text>
          </View>
        )}

        {photos.length > 0 && (
          <View style={styles.photoPreviewContainer}>
            {photos.map((photo, index) => (
              <View key={`${photo.uri}-${index}`} style={styles.photoPreview}>
                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                  disabled={isBusy}
                >
                  <Ionicons name="close-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {photoError && <Text style={styles.errorText}>{photoError}</Text>}

      {isUploading && (
        <View style={styles.uploadProgressContainer}>
          <Text style={styles.uploadProgressLabel}>Uploading photos: {Math.max(0, Math.min(100, uploadProgress))}%</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.max(2, Math.min(100, uploadProgress))}%` },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
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
    gap: 10,
    flexWrap: 'wrap',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
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
  galleryButton: {
    backgroundColor: '#eaf2ff',
    borderWidth: 1,
    borderColor: '#c9dcff',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  processingText: {
    color: '#3478f6',
    fontSize: 13,
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
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  uploadProgressContainer: {
    marginTop: 10,
    gap: 6,
  },
  uploadProgressLabel: {
    color: '#3478f6',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dbe7ff',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3478f6',
    borderRadius: 999,
  },
});

export default PhotoUploadComponent;
