/**
 * File handling utilities for Firebase Functions
 */
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from 'firebase-functions';
import { ValidationError } from './error-handler';

// Firebase storage bucket
let storageBucket: any; // Using any to avoid typing issues

// Maximum file size (10MB by default)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'application/pdf': { extension: 'pdf', type: 'document' },
  'application/msword': { extension: 'doc', type: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', type: 'document' },
  'text/plain': { extension: 'txt', type: 'text' },
  'text/csv': { extension: 'csv', type: 'data' },
  'application/json': { extension: 'json', type: 'data' },
  'image/jpeg': { extension: 'jpg', type: 'image' },
  'image/png': { extension: 'png', type: 'image' },
  'application/vnd.ms-excel': { extension: 'xls', type: 'data' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', type: 'data' },
};

/**
 * Initialize the storage bucket
 */
function getStorageBucket(): any {
  if (!storageBucket) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not set');
    }
    
    storageBucket = admin.storage().bucket(bucketName);
  }
  
  return storageBucket;
}

/**
 * Validate file buffer and metadata
 */
export function validateFile(
  buffer: Buffer,
  metadata: {
    filename: string;
    mimeType: string;
    size: number;
  }
): void {
  // Check file size
  if (metadata.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }
  
  // Check file type
  if (!metadata.mimeType || !(metadata.mimeType in ALLOWED_FILE_TYPES)) {
    throw new ValidationError(
      `Unsupported file type: ${metadata.mimeType || 'unknown'}`
    );
  }
  
  // Additional content validation could be added here
  // For example, scan PDFs for malicious content, etc.
}

/**
 * Upload file to Firebase Storage
 */
export async function uploadToStorage(
  buffer: Buffer,
  metadata: {
    filename: string;
    mimeType: string;
    userId: string;
  },
  destinationFolder: string = 'uploads'
): Promise<string> {
  try {
    // Get bucket
    const bucket = getStorageBucket();
    
    // Generate file path with userId for isolation
    const fileType = metadata.mimeType in ALLOWED_FILE_TYPES ?
                     (ALLOWED_FILE_TYPES as any)[metadata.mimeType].type : 'other';
    const timestamp = Date.now();
    const fileExtension = path.extname(metadata.filename) ||
                        `.${metadata.mimeType in ALLOWED_FILE_TYPES ?
                           (ALLOWED_FILE_TYPES as any)[metadata.mimeType].extension : 'bin'}`;
    
    const filename = `${path.basename(metadata.filename, fileExtension)}_${timestamp}${fileExtension}`;
    const filePath = `${destinationFolder}/${metadata.userId}/${fileType}/${filename}`;
    
    // Create file in bucket
    const file = bucket.file(filePath);
    
    // Upload file
    await file.save(buffer, {
      metadata: {
        contentType: metadata.mimeType,
        metadata: {
          originalName: metadata.filename,
          uploadedBy: metadata.userId,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Make file publicly accessible
    await file.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    logger.info(`File uploaded to Firebase Storage: ${publicUrl}`, {
      userId: metadata.userId,
      fileType,
      size: buffer.length
    });
    
    return publicUrl;
  } catch (error) {
    logger.error('Error uploading file to Firebase Storage:', error);
    throw error;
  }
}

/**
 * Save a base64 string as a file
 */
export async function saveBase64AsFile(
  base64Data: string,
  userId: string,
  filename: string,
  mimeType: string
): Promise<string> {
  try {
    // Extract data from base64 string
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new ValidationError('Invalid base64 data format');
    }
    
    // Use provided MIME type or the one from the base64 string
    const actualMimeType = mimeType || matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Validate file
    validateFile(buffer, {
      filename,
      mimeType: actualMimeType,
      size: buffer.length
    });
    
    // Upload to storage
    return await uploadToStorage(buffer, {
      filename,
      mimeType: actualMimeType,
      userId
    });
  } catch (error) {
    logger.error('Error saving base64 as file:', error);
    throw error;
  }
}

/**
 * Save a temporary file from multipart form data
 */
export async function saveMultipartFile(
  tempFilePath: string,
  userId: string,
  originalFilename: string,
  mimeType: string
): Promise<string> {
  try {
    // Read the temp file
    const buffer = fs.readFileSync(tempFilePath);
    
    // Get file stats
    const stats = fs.statSync(tempFilePath);
    
    // Validate file
    validateFile(buffer, {
      filename: originalFilename,
      mimeType,
      size: stats.size
    });
    
    // Upload to storage
    const url = await uploadToStorage(buffer, {
      filename: originalFilename,
      mimeType,
      userId
    });
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    return url;
  } catch (error) {
    logger.error('Error saving multipart file:', error);
    
    // Ensure temp file is deleted in case of error
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupError) {
      logger.warn('Error cleaning up temp file:', cleanupError);
    }
    
    throw error;
  }
}