import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { publicId } = await req.json();
    if (!publicId)
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    
    const result = await cloudinary.uploader.destroy(publicId);
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
