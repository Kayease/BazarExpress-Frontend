const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file, folder, options = {}) {
    const {
        validateBeforeUpload = true,
        allowedTypes = ['image', 'video'],
        maxSize,
        checkDimensions = true
    } = options;

    // Validate file before upload if requested
    if (validateBeforeUpload) {
        try {
            // Dynamic import for validation (since this is a .js file)
            const { validateFile } = await import('./fileValidation');
            const validationResult = await validateFile(file, {
                allowedTypes,
                maxSize,
                checkDimensions
            });

            if (!validationResult.isValid) {
                throw new Error(validationResult.error);
            }

            // Show warnings if any
            if (validationResult.warning) {
                console.warn(`File validation warning: ${validationResult.warning}`);
            }
        } catch (error) {
            throw new Error(`File validation failed: ${error.message}`);
        }
    }

    // Determine resource type based on file type
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const uploadUrl = `${CLOUDINARY_URL}/${resourceType}/upload`;
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    if (folder) {
        formData.append("folder", folder);
    }

    // Add optimization parameters for better performance
    // Note: transformation parameters are not allowed in unsigned uploads
    if (resourceType === 'image') {
        formData.append("quality", "auto");
        formData.append("fetch_format", "auto");
    } else if (resourceType === 'video') {
        formData.append("quality", "auto");
        formData.append("fetch_format", "auto");
    }
    
    const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${resourceType} upload failed: ${errorText}`);
    }

    const data = await res.json();
    return data.secure_url; // Cloudinary returns the URL here
}

// Batch upload function with validation
export async function uploadMultipleToCloudinary(files, folder, options = {}) {
    const {
        validateBeforeUpload = true,
        allowedTypes = ['image', 'video'],
        maxSize,
        maxFiles = 30
    } = options;

    if (files.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed per upload`);
    }

    // Validate all files before upload
    if (validateBeforeUpload) {
        try {
            const { validateFiles } = await import('./fileValidation');
            const { validFiles, invalidFiles } = await validateFiles(files, {
                allowedTypes,
                maxSize,
                maxFiles
            });

            if (invalidFiles.length > 0) {
                const errors = invalidFiles.map(({ file, error }) => `${file.name}: ${error}`).join(', ');
                throw new Error(`File validation failed: ${errors}`);
            }

            files = validFiles; // Use only valid files
        } catch (error) {
            throw new Error(`File validation failed: ${error.message}`);
        }
    }

    // Upload files in parallel with progress tracking
    const uploadPromises = files.map(async (file, index) => {
        try {
            const url = await uploadToCloudinary(file, folder, { validateBeforeUpload: false });
            return { success: true, url, index, fileName: file.name };
        } catch (error) {
            return { success: false, error: error.message, index, fileName: file.name };
        }
    });

    const results = await Promise.all(uploadPromises);
    
    // Separate successful and failed uploads
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (failed.length > 0) {
        const errorMessages = failed.map(r => `${r.fileName}: ${r.error}`).join(', ');
        throw new Error(`Some uploads failed: ${errorMessages}`);
    }

    return successful.map(r => r.url);
}