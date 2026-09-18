import { test } from "node:test";
import assert from "node:assert/strict";
import { createCloudinaryMediaService } from "../services/safargramMedia.js";

function fakeClient({ duration = 10 } = {}) {
  const calls = { upload: [], destroy: [] };
  return {
    calls,
    uploader: {
      async upload(path, options) {
        calls.upload.push({ path, options });
        return {
          secure_url: "https://res.test/x",
          public_id: "safarnama/safargram/x",
          width: 800,
          height: 600,
          duration,
        };
      },
      async destroy(publicId, options) {
        calls.destroy.push({ publicId, options });
        return { result: "ok" };
      },
    },
  };
}

test("images are uploaded resized to 1440px wide into the SafarGram folder", async () => {
  const client = fakeClient();
  const media = createCloudinaryMediaService(client);
  const item = await media.upload({ path: "/tmp/a.png", mimetype: "image/png", originalname: "a.png" });

  assert.deepEqual(item, {
    type: "image",
    url: "https://res.test/x",
    publicId: "safarnama/safargram/x",
    width: 800,
    height: 600,
  });
  const { options } = client.calls.upload[0];
  assert.equal(options.folder, "safarnama/safargram");
  assert.equal(options.resource_type, "image");
  assert.deepEqual(options.transformation[0], { width: 1440, crop: "limit" });
});

test("a video within 60s is accepted and keeps its duration", async () => {
  const media = createCloudinaryMediaService(fakeClient({ duration: 42 }));
  const item = await media.upload({ path: "/tmp/v.mp4", mimetype: "video/mp4", originalname: "v.mp4" });
  assert.equal(item.type, "video");
  assert.equal(item.duration, 42);
});

test("a video longer than 60s is deleted again and rejected", async () => {
  const client = fakeClient({ duration: 61 });
  const media = createCloudinaryMediaService(client);
  await assert.rejects(
    media.upload({ path: "/tmp/v.mp4", mimetype: "video/mp4", originalname: "v.mp4" }),
    (e) => e.statusCode === 400 && /60 seconds/.test(e.message),
  );
  assert.equal(client.calls.destroy.length, 1);
  assert.equal(client.calls.destroy[0].options.resource_type, "video");
});

test("remove() never throws, even when Cloudinary fails", async () => {
  const client = fakeClient();
  client.uploader.destroy = async () => {
    throw new Error("network down");
  };
  const media = createCloudinaryMediaService(client);
  await media.remove([{ type: "image", publicId: "a" }]); // must not throw
});
