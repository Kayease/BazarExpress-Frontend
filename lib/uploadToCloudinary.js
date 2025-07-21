const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export async function uploadToCloudinary(file, folder) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    if (folder) {
        formData.append("folder", folder);
    }
    const res = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.secure_url; // Cloudinary returns the image URL here
}