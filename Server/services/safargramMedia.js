import cloudinary from "../utils/Cloudinary.js";
import AppError from "../utils/AppError.js";
import { MEDIA_LIMITS, mediaKind } from "../utils/safargramMediaRules.js";

const FOLDER = "safarnama/safargram";

export function createCloudinaryMediaService(client = cloudinary, { folder = FOLDER } = {}) {
  async function upload(file) {
    if (mediaKind(file.mimetype, file.originalname) === "video") {
      const result = await client.uploader.upload(file.path, {
        folder,
        resource_type: "video",
      });
      if (result.duration > MEDIA_LIMITS.maxVideoSeconds) {
        await client.uploader
          .destroy(result.public_id, { resource_type: "video" })
          .catch(() => {});
        throw new AppError("Video must be 60 seconds or shorter", 400);
      }
      return {
        type: "video",
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    }

    const result = await client.uploader.upload(file.path, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 1440, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });
    return {
      type: "image",
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  async function remove(items = []) {
    await Promise.all(
      items.map(async (item) => {
        try {
          await client.uploader.destroy(item.publicId, {
            resource_type: item.type === "video" ? "video" : "image",
          });
        } catch (error) {
          console.error("Cloudinary cleanup failed:", item.publicId, error.message);
        }
      }),
    );
  }

  return { upload, remove };
}

export default createCloudinaryMediaService;
