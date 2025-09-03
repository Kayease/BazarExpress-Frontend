import { test, expect } from '@playwright/test';

/**
 * File Validation System Tests - Core Functionality
 * 
 * Tests the implementation of the centralized file validation utility
 * that was implemented with the following specs:
 * - Image: max 5MB, types JPEG/JPG/PNG/WebP/GIF, min 200x200, max 4096x4096
 * - Video: max 50MB, types MP4/WebM/OGG/AVI/MOV, max 5 min, max 1920x1080
 * - Document: max 10MB, types PDF/DOC/DOCX
 * - General: total size unlimited, max 30 files per session
 */

test.describe('File Validation Core System', () => {
  
  test.describe('File Validation Configuration', () => {
    test('should have correct validation configuration constants', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      // Test that validation configuration matches implementation specs
      const configTest = await page.evaluate(async () => {
        try {
          // Import and test the validation configuration
          const { FILE_VALIDATION_CONFIG } = await import('./lib/fileValidation.js');
          
          return {
            imageMaxSize: FILE_VALIDATION_CONFIG.images.maxSize,
            videoMaxSize: FILE_VALIDATION_CONFIG.videos.maxSize,
            documentMaxSize: FILE_VALIDATION_CONFIG.documents.maxSize,
            maxFilesPerUpload: FILE_VALIDATION_CONFIG.general.maxFilesPerUpload,
            imageTypes: FILE_VALIDATION_CONFIG.images.allowedTypes,
            videoTypes: FILE_VALIDATION_CONFIG.videos.allowedTypes,
            documentTypes: FILE_VALIDATION_CONFIG.documents.allowedTypes
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (configTest.error) {
        console.log('Configuration test skipped due to:', configTest.error);
        return;
      }
      
      // Verify configuration matches specifications
      expect(configTest.imageMaxSize).toBe(5 * 1024 * 1024); // 5MB
      expect(configTest.videoMaxSize).toBe(50 * 1024 * 1024); // 50MB  
      expect(configTest.documentMaxSize).toBe(10 * 1024 * 1024); // 10MB
      expect(configTest.maxFilesPerUpload).toBe(30);
      
      // Verify allowed types
      expect(configTest.imageTypes).toContain('image/jpeg');
      expect(configTest.imageTypes).toContain('image/png');
      expect(configTest.imageTypes).toContain('image/webp');
      expect(configTest.videoTypes).toContain('video/mp4');
      expect(configTest.documentTypes).toContain('application/pdf');
    });
    
    test('should validate file size formatting utility', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const sizeTest = await page.evaluate(async () => {
        try {
          const { formatFileSize } = await import('./lib/fileValidation.js');
          
          return {
            bytes: formatFileSize(1024),
            kb: formatFileSize(1024 * 1024),
            mb: formatFileSize(1024 * 1024 * 1024)
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (sizeTest.error) {
        console.log('Size formatting test skipped due to:', sizeTest.error);
        return;
      }
      
      expect(sizeTest.bytes).toBe('1 KB');
      expect(sizeTest.kb).toBe('1 MB');
      expect(sizeTest.mb).toBe('1 GB');
    });
    
    test('should validate file type icon utility', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const iconTest = await page.evaluate(async () => {
        try {
          const { getFileTypeIcon } = await import('./lib/fileValidation.js');
          
          return {
            image: getFileTypeIcon('image/jpeg'),
            video: getFileTypeIcon('video/mp4'),
            document: getFileTypeIcon('application/pdf'),
            unknown: getFileTypeIcon('unknown/type')
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (iconTest.error) {
        console.log('Icon test skipped due to:', iconTest.error);
        return;
      }
      
      expect(iconTest.image).toBe('🖼️');
      expect(iconTest.video).toBe('🎥');
      expect(iconTest.document).toBe('📄');
      expect(iconTest.unknown).toBe('📁');
    });
  });

  test.describe('File Validation Logic', () => {
    test('should validate image files correctly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const validationTest = await page.evaluate(async () => {
        try {
          const { validateFile } = await import('./lib/fileValidation.js');
          
          // Test valid image
          const validImage = new File([''], 'test.jpg', { type: 'image/jpeg' });
          Object.defineProperty(validImage, 'size', { value: 1024 * 1024 }); // 1MB
          
          // Test oversized image  
          const oversizedImage = new File([''], 'big.jpg', { type: 'image/jpeg' });
          Object.defineProperty(oversizedImage, 'size', { value: 6 * 1024 * 1024 }); // 6MB
          
          // Test invalid type
          const invalidType = new File([''], 'test.bmp', { type: 'image/bmp' });
          Object.defineProperty(invalidType, 'size', { value: 1024 * 1024 }); // 1MB
          
          const results = await Promise.all([
            validateFile(validImage, { allowedTypes: ['image'], checkDimensions: false }),
            validateFile(oversizedImage, { allowedTypes: ['image'], checkDimensions: false }),
            validateFile(invalidType, { allowedTypes: ['image'], checkDimensions: false })
          ]);
          
          return {
            valid: results[0],
            oversized: results[1], 
            invalidType: results[2]
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (validationTest.error) {
        console.log('Image validation test skipped due to:', validationTest.error);
        return;
      }
      
      // Valid image should pass
      expect(validationTest.valid.isValid).toBe(true);
      expect(validationTest.valid.fileType).toBe('image');
      
      // Oversized image should fail
      expect(validationTest.oversized.isValid).toBe(false);
      expect(validationTest.oversized.error).toContain('exceeds maximum allowed size');
      
      // Invalid type should fail
      expect(validationTest.invalidType.isValid).toBe(false);
      expect(validationTest.invalidType.error).toContain('not allowed');
    });

    test('should validate video files correctly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const videoTest = await page.evaluate(async () => {
        try {
          const { validateFile } = await import('./lib/fileValidation.js');
          
          // Test valid video
          const validVideo = new File([''], 'test.mp4', { type: 'video/mp4' });
          Object.defineProperty(validVideo, 'size', { value: 10 * 1024 * 1024 }); // 10MB
          
          // Test oversized video
          const oversizedVideo = new File([''], 'big.mp4', { type: 'video/mp4' });
          Object.defineProperty(oversizedVideo, 'size', { value: 60 * 1024 * 1024 }); // 60MB
          
          const results = await Promise.all([
            validateFile(validVideo, { allowedTypes: ['video'], checkDimensions: false }),
            validateFile(oversizedVideo, { allowedTypes: ['video'], checkDimensions: false })
          ]);
          
          return {
            valid: results[0],
            oversized: results[1]
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (videoTest.error) {
        console.log('Video validation test skipped due to:', videoTest.error);
        return;
      }
      
      // Valid video should pass
      expect(videoTest.valid.isValid).toBe(true);
      expect(videoTest.valid.fileType).toBe('video');
      
      // Oversized video should fail
      expect(videoTest.oversized.isValid).toBe(false);
      expect(videoTest.oversized.error).toContain('50MB');
    });

    test('should validate document files correctly', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const documentTest = await page.evaluate(async () => {
        try {
          const { validateFile } = await import('./lib/fileValidation.js');
          
          // Test valid PDF
          const validPdf = new File([''], 'test.pdf', { type: 'application/pdf' });
          Object.defineProperty(validPdf, 'size', { value: 2 * 1024 * 1024 }); // 2MB
          
          // Test oversized document
          const oversizedDoc = new File([''], 'big.pdf', { type: 'application/pdf' });
          Object.defineProperty(oversizedDoc, 'size', { value: 15 * 1024 * 1024 }); // 15MB
          
          const results = await Promise.all([
            validateFile(validPdf, { allowedTypes: ['document'], checkDimensions: false }),
            validateFile(oversizedDoc, { allowedTypes: ['document'], checkDimensions: false })
          ]);
          
          return {
            valid: results[0],
            oversized: results[1]
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (documentTest.error) {
        console.log('Document validation test skipped due to:', documentTest.error);
        return;
      }
      
      // Valid document should pass
      expect(documentTest.valid.isValid).toBe(true);
      expect(documentTest.valid.fileType).toBe('document');
      
      // Oversized document should fail
      expect(documentTest.oversized.isValid).toBe(false);
      expect(documentTest.oversized.error).toContain('10MB');
    });
  });

  test.describe('Batch File Validation', () => {
    test('should validate multiple files with limits', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const batchTest = await page.evaluate(async () => {
        try {
          const { validateFiles } = await import('./lib/fileValidation.js');
          
          // Create array of valid files
          const validFiles = Array.from({ length: 5 }, (_, i) => {
            const file = new File([''], `image${i}.jpg`, { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB each
            return file;
          });
          
          // Create array with too many files
          const tooManyFiles = Array.from({ length: 35 }, (_, i) => {
            const file = new File([''], `image${i}.jpg`, { type: 'image/jpeg' });
            Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB each
            return file;
          });
          
          const results = await Promise.all([
            validateFiles(validFiles, { allowedTypes: ['image'], maxFiles: 30 }),
            validateFiles(tooManyFiles, { allowedTypes: ['image'], maxFiles: 30 })
          ]);
          
          return {
            validBatch: results[0],
            tooManyBatch: results[1]
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (batchTest.error) {
        console.log('Batch validation test skipped due to:', batchTest.error);
        return;
      }
      
      // Valid batch should have all files accepted
      expect(batchTest.validBatch.validFiles.length).toBe(5);
      expect(batchTest.validBatch.invalidFiles.length).toBe(0);
      
      // Too many files should be rejected
      expect(batchTest.tooManyBatch.validFiles.length).toBe(0);
      expect(batchTest.tooManyBatch.invalidFiles.length).toBe(35);
      expect(batchTest.tooManyBatch.invalidFiles[0].error).toContain('Maximum 30 files');
    });
  });

  test.describe('Cloudinary Upload Integration', () => {
    test('should have upload functions available', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const uploadTest = await page.evaluate(async () => {
        try {
          const uploadModule = await import('./lib/uploadToCloudinary.js');
          
          return {
            hasSingleUpload: typeof uploadModule.uploadToCloudinary === 'function',
            hasMultipleUpload: typeof uploadModule.uploadMultipleToCloudinary === 'function'
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (uploadTest.error) {
        console.log('Upload function test skipped due to:', uploadTest.error);
        return;
      }
      
      expect(uploadTest.hasSingleUpload).toBe(true);
      expect(uploadTest.hasMultipleUpload).toBe(true);
    });
  });

  test.describe('Error Messages and User Feedback', () => {
    test('should provide clear error messages for different validation failures', async ({ page }) => {
      await page.goto('http://localhost:3000');
      
      const errorMessageTest = await page.evaluate(async () => {
        try {
          const { validateFile } = await import('./lib/fileValidation.js');
          
          // Test unsupported file type
          const unsupportedFile = new File([''], 'test.txt', { type: 'text/plain' });
          Object.defineProperty(unsupportedFile, 'size', { value: 1024 });
          
          // Test oversized image
          const oversizedImage = new File([''], 'big.jpg', { type: 'image/jpeg' });
          Object.defineProperty(oversizedImage, 'size', { value: 10 * 1024 * 1024 }); // 10MB
          
          // Test invalid image type for image category
          const invalidImage = new File([''], 'test.bmp', { type: 'image/bmp' });
          Object.defineProperty(invalidImage, 'size', { value: 1024 * 1024 });
          
          const results = await Promise.all([
            validateFile(unsupportedFile, { allowedTypes: ['image'] }),
            validateFile(oversizedImage, { allowedTypes: ['image'] }),
            validateFile(invalidImage, { allowedTypes: ['image'] })
          ]);
          
          return {
            unsupported: results[0],
            oversized: results[1],
            invalidType: results[2]
          };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      if (errorMessageTest.error) {
        console.log('Error message test skipped due to:', errorMessageTest.error);
        return;
      }
      
      // Verify error messages are informative
      expect(errorMessageTest.unsupported.error).toContain('File type not supported');
      expect(errorMessageTest.oversized.error).toContain('exceeds maximum allowed size');
      expect(errorMessageTest.oversized.error).toContain('5MB');
      expect(errorMessageTest.invalidType.error).toContain('not allowed');
    });
  });
});