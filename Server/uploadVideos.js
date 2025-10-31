import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const videosToUpload = [
  {
    localPath: path.join(__dirname, "../client/src/Assets/bg-video.mp4"),
    publicId: "safarnama/videos/bg-video",
    name: "Background Video 1",
  },
  {
    localPath: path.join(__dirname, "../client/src/Assets/bg-video2.mp4"),
    publicId: "safarnama/videos/bg-video2",
    name: "Background Video 2",
  },
  {
    localPath: path.join(__dirname, "../client/src/Assets/bg2-video.mp4"),
    publicId: "safarnama/videos/bg2-video",
    name: "Background Video 3",
  },
  {
    localPath: path.join(__dirname, "../client/src/Assets/hero-video.mp4"),
    publicId: "safarnama/videos/hero-video",
    name: "Hero Video",
  },
];

async function uploadVideo(video) {
  try {
    console.log(`\n📤 Uploading ${video.name}...`);
    console.log(`   Path: ${video.localPath}`);

    const result = await cloudinary.uploader.upload(video.localPath, {
      resource_type: "video",
      public_id: video.publicId,
      folder: "safarnama/videos",
      chunk_size: 6000000, // 6MB chunks for large files
      eager: [
        { width: 1920, height: 1080, crop: "limit", quality: "auto" },
        { width: 1280, height: 720, crop: "limit", quality: "auto" },
      ],
      eager_async: true,
      overwrite: true,
    });

    console.log(`   ✅ Success!`);
    console.log(`   📍 URL: ${result.secure_url}`);
    console.log(`   📦 Size: ${(result.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   ⏱️  Duration: ${result.duration}s`);

    return {
      name: video.name,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(`   ❌ Failed to upload ${video.name}:`);
    if (error.message.includes("ENOENT")) {
      console.error(`   File not found at: ${video.localPath}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return null;
  }
}

async function uploadAllVideos() {
  console.log("🎥 CLOUDINARY VIDEO UPLOADER FOR SAFARNAMA");
  console.log("=".repeat(50));
  console.log(`☁️  Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log("=".repeat(50));

  const results = [];

  for (const video of videosToUpload) {
    const result = await uploadVideo(video);
    if (result) {
      results.push(result);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 UPLOAD SUMMARY");
  console.log("=".repeat(50));

  if (results.length > 0) {
    console.log(
      `\n✅ Successfully uploaded ${results.length}/${videosToUpload.length} videos\n`
    );

    console.log("📝 Copy these URLs to your components:\n");
    results.forEach((r) => {
      console.log(`${r.name}:`);
      console.log(`"${r.url}"\n`);
    });

    console.log("\n💡 Update your React components with these URLs!");
    console.log('   Example: <video src="URL_FROM_ABOVE" />');
  } else {
    console.log("\n❌ No videos were uploaded. Check the errors above.");
  }
}

// Run the upload
uploadAllVideos().catch((error) => {
  console.error("\n❌ Upload process failed:", error);
  process.exit(1);
});
