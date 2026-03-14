import * as Location from 'expo-location';
import { Alert } from 'react-native';

// Location cache for storing last known position
let locationCache = {
  position: null,
  timestamp: null,
  accuracy: null,
};

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION_MS = 5 * 60 * 1000;

// GPS retry configuration
const GPS_RETRY_ATTEMPTS = 3;
const GPS_RETRY_DELAY_MS = 2000;

/**
 * GPS Error Types
 */
export const GPSErrorType = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  TIMEOUT: 'TIMEOUT',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Location Accuracy Levels
 */
export const AccuracyLevel = {
  HIGH: 'HIGH',        // < 10m
  MEDIUM: 'MEDIUM',    // 10-50m
  LOW: 'LOW',          // 50-100m
  VERY_LOW: 'VERY_LOW', // > 100m
  UNKNOWN: 'UNKNOWN',
};

/**
 * Determine accuracy level based on accuracy value in meters
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} - Accuracy level
 */
export const getAccuracyLevel = (accuracy) => {
  if (!accuracy || accuracy < 0) return AccuracyLevel.UNKNOWN;
  if (accuracy < 10) return AccuracyLevel.HIGH;
  if (accuracy < 50) return AccuracyLevel.MEDIUM;
  if (accuracy < 100) return AccuracyLevel.LOW;
  return AccuracyLevel.VERY_LOW;
};

/**
 * Get human-readable accuracy description
 * @param {string} level - Accuracy level
 * @returns {string} - Description
 */
export const getAccuracyDescription = (level) => {
  switch (level) {
    case AccuracyLevel.HIGH:
      return 'Excellent GPS signal';
    case AccuracyLevel.MEDIUM:
      return 'Good GPS signal';
    case AccuracyLevel.LOW:
      return 'Fair GPS signal';
    case AccuracyLevel.VERY_LOW:
      return 'Weak GPS signal';
    default:
      return 'GPS accuracy unknown';
  }
};

/**
 * Check if cached location is still valid
 * @returns {boolean}
 */
export const isCacheValid = () => {
  if (!locationCache.position || !locationCache.timestamp) {
    return false;
  }
  const now = Date.now();
  return (now - locationCache.timestamp) < CACHE_EXPIRATION_MS;
};

/**
 * Get cached location if valid
 * @returns {Object|null} - Cached location or null
 */
export const getCachedLocation = () => {
  if (isCacheValid()) {
    return {
      ...locationCache.position,
      accuracy: locationCache.accuracy,
      isCached: true,
      cacheAge: Date.now() - locationCache.timestamp,
    };
  }
  return null;
};

/**
 * Update location cache
 * @param {Object} position - Position object
 * @param {number} accuracy - Accuracy in meters
 */
export const updateLocationCache = (position, accuracy) => {
  locationCache = {
    position,
    timestamp: Date.now(),
    accuracy,
  };
};

/**
 * Clear location cache
 */
export const clearLocationCache = () => {
  locationCache = {
    position: null,
    timestamp: null,
    accuracy: null,
  };
};

/**
 * Sleep helper for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Classify GPS error
 * @param {Error} error - Error object
 * @returns {string} - Error type
 */
const classifyGPSError = (error) => {
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('permission')) {
    return GPSErrorType.PERMISSION_DENIED;
  }
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return GPSErrorType.TIMEOUT;
  }
  if (errorMessage.includes('unavailable') || errorMessage.includes('disabled')) {
    return GPSErrorType.POSITION_UNAVAILABLE;
  }
  if (errorMessage.includes('network')) {
    return GPSErrorType.NETWORK_ERROR;
  }
  
  return GPSErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message
 * @param {string} errorType - GPS error type
 * @returns {Object} - Error title and message
 */
const getGPSErrorMessage = (errorType) => {
  switch (errorType) {
    case GPSErrorType.PERMISSION_DENIED:
      return {
        title: 'Permission Denied',
        message: 'Location permission is required. Please enable it in your device settings.',
      };
    case GPSErrorType.TIMEOUT:
      return {
        title: 'GPS Timeout',
        message: 'Unable to get your location. Make sure you are outdoors or near a window for better GPS signal.',
      };
    case GPSErrorType.POSITION_UNAVAILABLE:
      return {
        title: 'GPS Unavailable',
        message: 'Location services may be disabled. Please enable GPS in your device settings.',
      };
    case GPSErrorType.NETWORK_ERROR:
      return {
        title: 'Network Error',
        message: 'Network connection is required for assisted GPS. Please check your internet connection.',
      };
    default:
      return {
        title: 'Location Error',
        message: 'Failed to get your location. Please try again or set location manually on the map.',
      };
  }
};

/**
 * Request location permissions from the user
 * @returns {Promise<boolean>} - Returns true if permission granted, false otherwise
 */
export const requestLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get the current position of the user with retry logic and caching
 * @param {Object} options - Options object
 * @param {boolean} options.useCache - Whether to use cached location if available
 * @param {boolean} options.showAlert - Whether to show alert on error
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @returns {Promise<Object|null>} - Returns position object with latitude, longitude, and accuracy, or null if failed
 */
export const getCurrentPosition = async (options = {}) => {
  const {
    useCache = true,
    showAlert = true,
    maxRetries = GPS_RETRY_ATTEMPTS,
  } = options;

  // Check cache first if enabled
  if (useCache) {
    const cached = getCachedLocation();
    if (cached) {
      console.log('Using cached location (age: ' + Math.round(cached.cacheAge / 1000) + 's)');
      return cached;
    }
  }

  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      if (showAlert) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to get your current location.'
        );
      }
      return null;
    }

    // Try to get location with retries
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempting to get location (attempt ${attempt}/${maxRetries})...`);
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 0,
        });

        const accuracy = location.coords.accuracy || null;
        const accuracyLevel = getAccuracyLevel(accuracy);
        
        const position = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy,
          accuracyLevel,
          accuracyDescription: getAccuracyDescription(accuracyLevel),
          timestamp: location.timestamp,
          isCached: false,
        };

        // Update cache
        updateLocationCache(position, accuracy);
        
        console.log(`Location acquired: ${accuracyLevel} accuracy (${accuracy?.toFixed(1)}m)`);
        return position;
        
      } catch (err) {
        lastError = err;
        console.log(`Location attempt ${attempt} failed:`, err.message);
        
        // Don't retry if permission was denied
        const errorType = classifyGPSError(err);
        if (errorType === GPSErrorType.PERMISSION_DENIED) {
          throw err;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries) {
          await sleep(GPS_RETRY_DELAY_MS);
        }
      }
    }
    
    // All retries failed
    throw lastError;
    
  } catch (error) {
    console.error('Error getting current position:', error);
    
    const errorType = classifyGPSError(error);
    const errorMsg = getGPSErrorMessage(errorType);
    
    if (showAlert) {
      Alert.alert(errorMsg.title, errorMsg.message);
    }
    
    return null;
  }
};

/**
 * Convert coordinates to a human-readable address
 * @param {Object} coords - Object with latitude and longitude
 * @returns {Promise<string>} - Returns formatted address string
 */
export const reverseGeocode = async (coords) => {
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

/**
 * Initialize location by requesting permission and getting current position
 * @param {Object} callbacks - Callbacks for updating UI state
 * @param {Function} callbacks.setMapRegion - Function to set map region
 * @param {Function} callbacks.setIsLoadingLocation - Function to set loading state
 * @param {boolean} isWeb - Whether the platform is web
 * @returns {Promise<void>}
 */
export const initializeLocation = async ({ setMapRegion, setIsLoadingLocation }, isWeb = false) => {
  // Skip map initialization on web
  if (isWeb) {
    return;
  }

  setIsLoadingLocation(true);
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      // Try to get location with retry and caching
      const position = await getCurrentPosition({ 
        useCache: true, 
        showAlert: false,
        maxRetries: 2,
      });
      
      if (position) {
        const newRegion = {
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setMapRegion(newRegion);
        console.log(`Map initialized with ${position.accuracyDescription}`);
      } else {
        // Fallback to default location or show message
        console.log('Could not get initial location');
      }
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
};

/**
 * Get current location and update form with coordinates and address
 * @param {Object} callbacks - Callbacks for updating UI and form state
 * @returns {Promise<Object|null>} - Returns position with accuracy info or null
 */
export const getCurrentLocationWithAddress = async ({
  setIsLoadingLocation,
  setLocationAddress,
  setValue,
  setMarkerPosition,
  setMapRegion,
  mapRef,
  isWeb,
  setLocationAccuracy, // Optional callback for accuracy indicator
}) => {
  setIsLoadingLocation(true);
  try {
    // Get position with retry and caching (prefer fresh location for user-initiated requests)
    const position = await getCurrentPosition({ 
      useCache: false, 
      showAlert: true,
      maxRetries: GPS_RETRY_ATTEMPTS,
    });
    
    if (!position) {
      setIsLoadingLocation(false);
      return null;
    }

    // Reverse geocode to get address
    const address = await reverseGeocode(position);
    setLocationAddress(address);

    // Update accuracy indicator if callback provided
    if (setLocationAccuracy) {
      setLocationAccuracy({
        level: position.accuracyLevel,
        description: position.accuracyDescription,
        meters: position.accuracy,
      });
    }

    // Update form with location data including accuracy
    setValue('location', {
      latitude: position.latitude,
      longitude: position.longitude,
      address,
      accuracy: position.accuracy,
      accuracyLevel: position.accuracyLevel,
    }, { shouldValidate: true });

    // Only update map on native platforms
    if (!isWeb) {
      setMarkerPosition({
        latitude: position.latitude,
        longitude: position.longitude,
      });
      setMapRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Animate map to new position
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: position.latitude,
          longitude: position.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    }

    return position;
  } catch (error) {
    console.error('Location error:', error);
    return null;
  } finally {
    setIsLoadingLocation(false);
  }
};

/**
 * Handle map press event to set location from tap
 * @param {Object} event - Map press event
 * @param {Object} callbacks - Callbacks for updating UI and form state
 * @returns {Promise<void>}
 */
export const handleMapPress = async (event, { setMarkerPosition, setLocationAddress, setValue }) => {
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

/**
 * Handle marker drag end event to update location
 * @param {Object} event - Marker drag end event
 * @param {Object} callbacks - Callbacks for updating UI and form state
 * @returns {Promise<void>}
 */
export const handleMarkerDragEnd = async (event, { setMarkerPosition, setLocationAddress, setValue }) => {
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
