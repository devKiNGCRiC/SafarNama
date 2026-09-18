// Drop-in replacement for the Cloudinary media service in tests.
export function createFakeMedia({ failOnUpload = false, failOnSecond = false } = {}) {
  const uploaded = [];
  const removed = [];
  let counter = 0;

  return {
    uploaded,
    removed,
    async upload(file) {
      counter += 1;
      if (failOnUpload || (failOnSecond && counter === 2)) {
        throw new Error("upload failed");
      }
      const type = file.mimetype.startsWith("video/") ? "video" : "image";
      const item = {
        type,
        url: `https://cdn.test/${counter}`,
        publicId: `test/${counter}`,
        width: 100,
        height: 100,
        ...(type === "video" ? { duration: 20 } : {}),
      };
      uploaded.push(item);
      return item;
    },
    async remove(items = []) {
      removed.push(...items);
    },
  };
}
