import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getPublicIdFromUrl(url: string) {
  // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/filename.jpg
  // Returns: folder/filename (without extension)
  try {
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return null;
    let publicIdParts = parts.slice(uploadIndex + 1);
    // Remove version if present (starts with 'v' and is followed by digits)
    if (publicIdParts[0] && publicIdParts[0].startsWith('v') && !isNaN(Number(publicIdParts[0].slice(1)))) {
      publicIdParts = publicIdParts.slice(1);
    }
    const publicIdWithExt = publicIdParts.join("/");
    return publicIdWithExt.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl)
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    const public_id = getPublicIdFromUrl(imageUrl);
    if (!public_id)
      return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 });
    const result = await cloudinary.uploader.destroy(public_id);
    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json(
        { error: "Failed to delete image", details: result },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: err },
      { status: 500 }
    );
  }
}
