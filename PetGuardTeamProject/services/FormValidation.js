/**
 * FormValidation.js
 * Comprehensive form validation utilities for PetGuard emergency reporting
 * Provides real-time field validation, phone formatting, email validation,
 * required field checking, custom validation rules, and error message generation
 */

// Validation patterns
const PATTERNS = {
  phone: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./]?[(]?[0-9]{1,4}[)]?[-\s./]?[0-9]{1,9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: /^[a-zA-Z\s'-]+$/,
  coordinates: /^-?\d+\.?\d*,-?\d+\.?\d*$/
};

// Error messages
const ERROR_MESSAGES = {
  required: 'This field is required',
  phone: 'Please enter a valid phone number',
  email: 'Please enter a valid email address',
  name: 'Please enter a valid name',
  location: 'Please select a location',
  transportation: 'Please select a transportation option',
  photos: 'Please upload at least one photo',
  coordinates: 'Please enter valid coordinates (latitude,longitude)',
  minLength: (min) => `Must be at least ${min} characters`,
  maxLength: (max) => `Must not exceed ${max} characters`,
  custom: 'Validation failed'
};

/**
 * Phone number formatting utilities
 */
export const PhoneFormatter = {
  /**
   * Format phone number to standard format
   * @param {string} phone - Raw phone number input
   * @returns {string} Formatted phone number
   */
  format: (phone) => {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  },

  /**
   * Sanitize phone number for validation
   * @param {string} phone - Phone number to sanitize
   * @returns {string} Sanitized phone number
   */
  sanitize: (phone) => {
    return phone.replace(/\D/g, '');
  }
};

/**
 * Email validation utilities
 */
export const EmailValidator = {
  /**
   * Validate email address format
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValid: (email) => {
    if (!email || typeof email !== 'string') return false;
    return PATTERNS.email.test(email.trim());
  },

  /**
   * Normalize email address
   * @param {string} email - Email to normalize
   * @returns {string} Normalized email
   */
  normalize: (email) => {
    return email ? email.trim().toLowerCase() : '';
  }
};

/**
 * Real-time field validation
 */
export class RealTimeValidator {
  constructor() {
    this.validationRules = new Map();
    this.fieldErrors = new Map();
    this.listeners = new Map();
  }

  /**
   * Register validation rules for a field
   * @param {string} fieldName - Field name
   * @param {Array} rules - Array of validation rules
   */
  registerField(fieldName, rules) {
    this.validationRules.set(fieldName, rules);
  }

  /**
   * Validate a single field in real-time
   * @param {string} fieldName - Field name
   * @param {any} value - Field value
   * @param {Object} context - Additional context for validation
   * @returns {Object} Validation result
   */
  validateField(fieldName, value, context = {}) {
    const rules = this.validationRules.get(fieldName);
    if (!rules) return { isValid: true, errors: [] };

    const errors = [];
    
    for (const rule of rules) {
      const result = this.executeRule(rule, value, context);
      if (!result.isValid) {
        errors.push(result.message);
      }
    }

    const isValid = errors.length === 0;
    
    // Update field errors
    if (isValid) {
      this.fieldErrors.delete(fieldName);
    } else {
      this.fieldErrors.set(fieldName, errors);
    }

    // Notify listeners
    this.notifyListeners(fieldName, isValid, errors);

    return { isValid, errors };
  }

  /**
   * Execute a single validation rule
   * @param {Object} rule - Validation rule
   * @param {any} value - Field value
   * @param {Object} context - Validation context
   * @returns {Object} Rule validation result
   */
  executeRule(rule, value, context) {
    const { type, validator, message, required, min, max, pattern } = rule;

    // Required field validation
    if (required && this.isEmpty(value)) {
      return {
        isValid: false,
        message: message || ERROR_MESSAGES.required
      };
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value)) {
      return { isValid: true, message: '' };
    }

    // Built-in validators
    switch (type) {
      case 'email':
        return {
          isValid: EmailValidator.isValid(value),
          message: message || ERROR_MESSAGES.email
        };

      case 'phone':
        return {
          isValid: PATTERNS.phone.test(value),
          message: message || ERROR_MESSAGES.phone
        };

      case 'name':
        return {
          isValid: PATTERNS.name.test(value),
          message: message || ERROR_MESSAGES.name
        };

      case 'pattern':
        return {
          isValid: pattern.test(value),
          message: message || ERROR_MESSAGES.custom
        };

      case 'length':
        const length = value.toString().length;
        if (min !== undefined && length < min) {
          return {
            isValid: false,
            message: message || ERROR_MESSAGES.minLength(min)
          };
        }
        if (max !== undefined && length > max) {
          return {
            isValid: false,
            message: message || ERROR_MESSAGES.maxLength(max)
          };
        }
        return { isValid: true, message: '' };

      case 'custom':
        return validator(value, context);

      default:
        return { isValid: true, message: '' };
    }
  }

  /**
   * Check if value is empty
   * @param {any} value - Value to check
   * @returns {boolean} True if empty
   */
  isEmpty(value) {
    return value === null || 
           value === undefined || 
           value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  /**
   * Add listener for field validation changes
   * @param {string} fieldName - Field name
   * @param {Function} callback - Callback function
   */
  addListener(fieldName, callback) {
    if (!this.listeners.has(fieldName)) {
      this.listeners.set(fieldName, []);
    }
    this.listeners.get(fieldName).push(callback);
  }

  /**
   * Notify listeners of validation changes
   * @param {string} fieldName - Field name
   * @param {boolean} isValid - Validation result
   * @param {Array} errors - Error messages
   */
  notifyListeners(fieldName, isValid, errors) {
    const fieldListeners = this.listeners.get(fieldName);
    if (fieldListeners) {
      fieldListeners.forEach(callback => {
        callback(fieldName, isValid, errors);
      });
    }
  }

  /**
   * Get all current field errors
   * @returns {Map} Field errors
   */
  getAllErrors() {
    return new Map(this.fieldErrors);
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.fieldErrors.clear();
  }
}

/**
 * Custom validation rules for different scenarios
 */
export const CustomValidationRules = {
  /**
   * Emergency reporting validation rules
   */
  emergencyReporting: {
    yourName: [
      { type: 'required', required: true },
      { type: 'name' },
      { type: 'length', min: 2, max: 50 }
    ],
    phoneNumber: [
      { type: 'required', required: true },
      { type: 'phone' }
    ],
    emailAddress: [
      { type: 'required', required: true },
      { type: 'email' }
    ],
    location: [
      { type: 'required', required: true },
      { 
        type: 'custom',
        validator: (value) => {
          if (!value || (!value.latitude && !value.address)) {
            return { isValid: false, message: ERROR_MESSAGES.location };
          }
          return { isValid: true, message: '' };
        }
      }
    ],
    additionalDetails: [
      { type: 'length', max: 500 }
    ]
  }
};

// Define high priority emergency rules by extending emergency reporting
CustomValidationRules.highPriorityEmergency = {
  ...CustomValidationRules.emergencyReporting,
  phoneNumber: [
    { type: 'required', required: true },
    { type: 'phone' },
    { 
      type: 'custom',
      validator: (value) => {
        const sanitized = PhoneFormatter.sanitize(value);
        if (sanitized.length < 10) {
          return { isValid: false, message: 'Phone number must have at least 10 digits' };
        }
        return { isValid: true, message: '' };
      }
    }
  ],
  additionalDetails: [
    { type: 'required', required: true },
    { type: 'length', min: 10, max: 500 }
  ]
};

// Define animal emergency rules by extending emergency reporting
CustomValidationRules.animalEmergency = {
  ...CustomValidationRules.emergencyReporting,
  additionalDetails: [
    { type: 'required', required: true },
    { 
      type: 'custom',
      validator: (value) => {
        const animalKeywords = ['dog', 'cat', 'bird', 'animal', 'pet', 'wild'];
        const hasAnimalInfo = animalKeywords.some(keyword => 
          value.toLowerCase().includes(keyword)
        );
        
        if (!hasAnimalInfo) {
          return { 
            isValid: false, 
            message: 'Please provide details about the animal involved' 
          };
        }
        return { isValid: true, message: '' };
      }
    }
  ]
};

/**
 * Error message generation utilities
 */
export const ErrorMessageGenerator = {
  /**
   * Generate user-friendly error message
   * @param {string} fieldName - Field name
   * @param {Array} errors - Array of error messages
   * @returns {string} Formatted error message
   */
  generate: (fieldName, errors) => {
    if (!errors || errors.length === 0) return '';
    
    const fieldDisplayName = ErrorMessageGenerator.formatFieldName(fieldName);
    const primaryError = errors[0];
    
    return `${fieldDisplayName}: ${primaryError}`;
  },

  /**
   * Format field name for display
   * @param {string} fieldName - Field name
   * @returns {string} Formatted field name
   */
  formatFieldName: (fieldName) => {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  },

  /**
   * Generate summary of all form errors
   * @param {Map} fieldErrors - Map of field errors
   * @returns {string} Error summary
   */
  generateSummary: (fieldErrors) => {
    const errorCount = Array.from(fieldErrors.values())
      .reduce((total, errors) => total + errors.length, 0);
    
    if (errorCount === 0) return '';
    
    const fieldNames = Array.from(fieldErrors.keys())
      .map(name => ErrorMessageGenerator.formatFieldName(name))
      .join(', ');
    
    return `Please correct the ${errorCount} error${errorCount > 1 ? 's' : ''} in: ${fieldNames}`;
  }
};

/**
 * Required field validation utilities
 */
export const RequiredFieldValidator = {
  /**
   * Check if all required fields are filled
   * @param {Object} formData - Form data
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} Validation result
   */
  validateRequired: (formData, requiredFields) => {
    const missingFields = [];
    const errors = new Map();
    
    for (const field of requiredFields) {
      const value = formData[field];
      
      if (RequiredFieldValidator.isEmpty(value)) {
        missingFields.push(field);
        errors.set(field, [ERROR_MESSAGES.required]);
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields,
      errors
    };
  },

  /**
   * Check if value is empty
   * @param {any} value - Value to check
   * @returns {boolean} True if empty
   */
  isEmpty: (value) => {
    if (value === null || value === undefined || value === '') {
      return true;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    return false;
  }
};

/**
 * Main FormValidation class that combines all validation features
 */
export class FormValidation {
  constructor(scenario = 'emergencyReporting') {
    this.validator = new RealTimeValidator();
    this.scenario = scenario;
    this.setupValidationRules();
  }

  /**
   * Setup validation rules based on scenario
   */
  setupValidationRules() {
    const rules = CustomValidationRules[this.scenario] || CustomValidationRules.emergencyReporting;
    
    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      this.validator.registerField(fieldName, fieldRules);
    });
  }

  /**
   * Validate entire form
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result
   */
  validateForm(formData) {
    const allErrors = new Map();
    let isValid = true;

    Object.entries(formData).forEach(([fieldName, value]) => {
      const result = this.validator.validateField(fieldName, value, formData);
      if (!result.isValid) {
        isValid = false;
        allErrors.set(fieldName, result.errors);
      }
    });

    return {
      isValid,
      errors: allErrors,
      summary: isValid ? '' : ErrorMessageGenerator.generateSummary(allErrors)
    };
  }

  /**
   * Validate single field with real-time feedback
   * @param {string} fieldName - Field name
   * @param {any} value - Field value
   * @param {Object} context - Additional context
   * @returns {Object} Validation result
   */
  validateField(fieldName, value, context = {}) {
    return this.validator.validateField(fieldName, value, context);
  }

  /**
   * Add real-time validation listener
   * @param {string} fieldName - Field name
   * @param {Function} callback - Validation callback
   */
  addValidationListener(fieldName, callback) {
    this.validator.addListener(fieldName, callback);
  }

  /**
   * Format phone number
   * @param {string} phone - Phone number to format
   * @returns {string} Formatted phone number
   */
  formatPhone(phone) {
    return PhoneFormatter.format(phone);
  }

  /**
   * Get error message for field
   * @param {string} fieldName - Field name
   * @returns {string} Error message
   */
  getErrorMessage(fieldName) {
    const errors = this.validator.fieldErrors.get(fieldName);
    return errors ? ErrorMessageGenerator.generate(fieldName, errors) : '';
  }

  /**
   * Clear all validation errors
   */
  clearErrors() {
    this.validator.clearErrors();
  }
}

/**
 * Convenience function to create form validator for specific scenario
 * @param {string} scenario - Validation scenario
 * @returns {FormValidation} Form validator instance
 */
export const createFormValidator = (scenario = 'emergencyReporting') => {
  return new FormValidation(scenario);
};

// Export default FormValidation class
export default FormValidation;
