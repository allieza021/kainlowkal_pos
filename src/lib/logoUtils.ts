/**
 * Logo utilities for POS receipt system
 * Handles validation, file naming, and configuration for logo uploads
 */

import { buildReceiptHtml } from '../components/Receipt';
import type { ReceiptOrder } from '../types';

export const LOGO_CONFIG = {
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp'],
  maxSizeBytes: 5 * 1024 * 1024,
  maxWidthMm: 50,
  maxHeightMm: 30,
  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp']
};

/**
 * Validates logo file against size and type constraints
 * @param file - File to validate
 * @returns Validation result with optional error message
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  if (!LOGO_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PNG, JPG, and WEBP formats are supported'
    };
  }

  if (file.size > LOGO_CONFIG.maxSizeBytes) {
    return {
      valid: false,
      error: 'File size must be under 5MB'
    };
  }

  return { valid: true };
}

/**
 * Generates consistent file name for logo storage
 * @param file - File to generate name for
 * @returns Storage path with timestamp and extension
 */
export function getLogoFileName(file: File): string {
  const timestamp = Date.now();
  const ext = file.type.includes('webp')
    ? 'webp'
    : file.type.includes('png')
      ? 'png'
      : 'jpg';
  return `logos/${timestamp}.${ext}`;
}

/**
 * Generates receipt preview HTML for testing logo display
 * Useful for testing before printing
 */
export function generateReceiptPreview(order: ReceiptOrder): string {
  return buildReceiptHtml(order);
}

/**
 * Checks if logo should be displayed based on URL validity
 * @param logoUrl - Logo URL to check
 * @returns True if logo URL is valid and non-empty
 */
export function shouldDisplayLogo(logoUrl?: string | null): boolean {
  return Boolean(logoUrl && logoUrl.trim());
}
