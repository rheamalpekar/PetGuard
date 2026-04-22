/**
 * TypeScript declarations for FormValidation.js
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Map<string, string[]>;
  summary: string;
}

export interface ValidationRule {
  type?: 'email' | 'phone' | 'name' | 'pattern' | 'length' | 'custom';
  validator?: (value: any, context?: any) => ValidationResult;
  message?: string;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

export interface PhoneFormatter {
  format: (phone: string) => string;
  sanitize: (phone: string) => string;
}

export interface EmailValidator {
  isValid: (email: string) => boolean;
  normalize: (email: string) => string;
}

export interface RealTimeValidator {
  registerField(fieldName: string, rules: ValidationRule[]): void;
  validateField(fieldName: string, value: any, context?: any): ValidationResult;
  addListener(fieldName: string, callback: (fieldName: string, isValid: boolean, errors: string[]) => void): void;
  getAllErrors(): Map<string, string[]>;
  clearErrors(): void;
}

export interface FormValidator {
  validateForm(formData: any): FormValidationResult;
  validateField(fieldName: string, value: any, context?: any): ValidationResult;
  addValidationListener(fieldName: string, callback: (fieldName: string, isValid: boolean, errors: string[]) => void): void;
  formatPhone(phone: string): string;
  getErrorMessage(fieldName: string): string;
  clearErrors(): void;
}

export declare const PhoneFormatter: PhoneFormatter;
export declare const EmailValidator: EmailValidator;

export declare class RealTimeValidator {
  registerField(fieldName: string, rules: ValidationRule[]): void;
  validateField(fieldName: string, value: any, context?: any): ValidationResult;
  addListener(fieldName: string, callback: (fieldName: string, isValid: boolean, errors: string[]) => void): void;
  getAllErrors(): Map<string, string[]>;
  clearErrors(): void;
}

export declare class FormValidation {
  validateForm(formData: any): FormValidationResult;
  validateField(fieldName: string, value: any, context?: any): ValidationResult;
  addValidationListener(fieldName: string, callback: (fieldName: string, isValid: boolean, errors: string[]) => void): void;
  formatPhone(phone: string): string;
  getErrorMessage(fieldName: string): string;
  clearErrors(): void;
}

export declare const createFormValidator: (scenario?: string) => FormValidation;
