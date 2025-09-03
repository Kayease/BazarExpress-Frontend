// File validation constants for ecommerce standards
type ImageConfig = {
  maxSize: number;
  allowedTypes: string[];
  maxDimensions: { width: number; height: number };
  minDimensions: { width: number; height: number };
};

type VideoConfig = {
  maxSize: number;
  allowedTypes: string[];
  maxDuration: number;
  maxDimensions: { width: number; height: number };
};

type DocumentConfig = {
  maxSize: number;
  allowedTypes: string[];
};

type GeneralConfig = {
  maxTotalSize: number;
  maxFilesPerUpload: number;
};

type ValidationConfig = {
  images: ImageConfig;
  videos: VideoConfig;
  documents: DocumentConfig;
  general: GeneralConfig;
};

export const FILE_VALIDATION_CONFIG: ValidationConfig = {
  // Image restrictions
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    maxDimensions: { width: 4096, height: 4096 }, // 4K max
    minDimensions: { width: 200, height: 200 }, // Minimum for quality
  },
  
  // Video restrictions
  videos: {
    maxSize: 50 * 1024 * 1024, // 50MB (reduced from 100MB for better performance)
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    maxDuration: 300, // 5 minutes max
    maxDimensions: { width: 1920, height: 1080 }, // Full HD max
  },
  
  // Document restrictions (for product manuals, etc.)
  documents: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // General restrictions
  general: {
    maxTotalSize: Number.POSITIVE_INFINITY, // No total size limit per upload session
    maxFilesPerUpload: 30, // Maximum files per upload
  }
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  fileType: 'image' | 'video' | 'document' | 'unsupported';
  sizeInMB: number;
  dimensions?: { width: number; height: number };
}

export interface FileValidationOptions {
  allowedTypes?: ('image' | 'video' | 'document')[];
  maxSize?: number;
  maxFiles?: number;
  checkDimensions?: boolean;
}

// Helper function to get file type category
function getFileTypeCategory(file: File): 'image' | 'video' | 'document' | 'unsupported' {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('application/')) return 'document';
  return 'unsupported';
}

// Helper function to get file dimensions (for images)
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
}

// Helper function to get video duration and dimensions
async function getVideoMetadata(file: File): Promise<{ duration: number; width: number; height: number } | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
    };
    video.onerror = () => {
      resolve(null);
    };
    video.src = URL.createObjectURL(file);
  });
}

// Main validation function
export async function validateFile(
  file: File, 
  options: FileValidationOptions = {}
): Promise<FileValidationResult> {
  const {
    allowedTypes = ['image', 'video'],
    maxSize,
    checkDimensions = true
  } = options;

  const fileType = getFileTypeCategory(file);
  const sizeInMB = file.size / (1024 * 1024);

  // Immediately fail unsupported types
  if (fileType === 'unsupported') {
    return {
      isValid: false,
      error: 'File type not supported.',
      fileType: 'unsupported',
      sizeInMB
    };
  }

  // At this point, fileType is narrowed to 'image' | 'video' | 'document'
  const narrowedType: 'image' | 'video' | 'document' = fileType;

  // Check if file type is allowed by options
  if (!allowedTypes.includes(narrowedType)) {
    return {
      isValid: false,
      error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
      fileType: 'unsupported',
      sizeInMB
    };
  }

  // Get configuration based on file type
  const imageConfig = FILE_VALIDATION_CONFIG.images;
  const videoConfig = FILE_VALIDATION_CONFIG.videos;
  const documentConfig = FILE_VALIDATION_CONFIG.documents;

  // Check file size
  const maxAllowedSize = maxSize || (narrowedType === 'image' ? imageConfig.maxSize : narrowedType === 'video' ? videoConfig.maxSize : documentConfig.maxSize);
  if (file.size > maxAllowedSize) {
    const maxSizeMB = maxAllowedSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size (${sizeInMB.toFixed(1)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      fileType: narrowedType,
      sizeInMB
    };
  }

  // Check file type within category
  const allowedMimeTypes = narrowedType === 'image' ? imageConfig.allowedTypes : narrowedType === 'video' ? videoConfig.allowedTypes : documentConfig.allowedTypes;
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed for ${narrowedType}s`,
      fileType: narrowedType,
      sizeInMB
    };
  }

  let result: FileValidationResult = {
    isValid: true,
    fileType: narrowedType,
    sizeInMB
  };

  // Check dimensions if required
  if (checkDimensions && narrowedType === 'image') {
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      result.dimensions = dimensions;
      
      if (dimensions.width > imageConfig.maxDimensions.width || dimensions.height > imageConfig.maxDimensions.height) {
        result.warning = `Image dimensions (${dimensions.width}x${dimensions.height}) exceed recommended maximum (${imageConfig.maxDimensions.width}x${imageConfig.maxDimensions.height}). Image will be resized.`;
      }
      
      if (dimensions.width < imageConfig.minDimensions.width || dimensions.height < imageConfig.minDimensions.height) {
        result.warning = `Image dimensions (${dimensions.width}x${dimensions.height}) are below recommended minimum (${imageConfig.minDimensions.width}x${imageConfig.minDimensions.height}). Image quality may be poor.`;
      }
    }
  }

  // Check video metadata if required
  if (checkDimensions && narrowedType === 'video') {
    const metadata = await getVideoMetadata(file);
    if (metadata) {
      result.dimensions = { width: metadata.width, height: metadata.height };
      
      if (metadata.duration > videoConfig.maxDuration) {
        result.warning = `Video duration (${Math.round(metadata.duration)}s) exceeds recommended maximum (${videoConfig.maxDuration}s).`;
      }
      
      if (metadata.width > videoConfig.maxDimensions.width || metadata.height > videoConfig.maxDimensions.height) {
        result.warning = `Video dimensions (${metadata.width}x${metadata.height}) exceed recommended maximum (${videoConfig.maxDimensions.width}x${videoConfig.maxDimensions.height}). Video will be compressed.`;
      }
    }
  }

  return result;
}

// Batch validation function
export async function validateFiles(
  files: File[], 
  options: FileValidationOptions = {}
): Promise<{ validFiles: File[]; invalidFiles: { file: File; error: string }[] }> {
  const { maxFiles = FILE_VALIDATION_CONFIG.general.maxFilesPerUpload } = options;
  
  if (files.length > maxFiles) {
    return {
      validFiles: [],
      invalidFiles: files.map(file => ({ 
        file, 
        error: `Maximum ${maxFiles} files allowed per upload` 
      }))
    };
  }

  const validationPromises = files.map(async (file) => {
    const result = await validateFile(file, options);
    return { file, result };
  });

  const validationResults = await Promise.all(validationPromises);
  
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];

  validationResults.forEach(({ file, result }) => {
    if (result.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, error: result.error! });
    }
  });

  return { validFiles, invalidFiles };
}

// Utility function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Utility function to get file type icon
export function getFileTypeIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎥';
  if (fileType.startsWith('application/')) return '📄';
  return '📁';
}
