// What a notification says and where clicking it should go. Pure functions (tested in Node).

export function actorName(actor) {
  if (!actor) return "Someone";
  return actor.username || [actor.firstName, actor.lastName].filter(Boolean).join(" ") || "Someone";
}

export function describe(notification) {
  switch (notification.type) {
    case "like":
      return "liked your post";
    case "comment":
      return notification.text ? `commented: “${notification.text}”` : "commented on your post";
    case "follow":
      return "started following you";
    default:
      return "did something";
  }
}

export function targetPath(notification) {
  if (notification.type === "follow") {
    return notification.actor?.username ? `/profile/${notification.actor.username}` : "/notifications";
  }
  // like / comment -> the post (if it still exists)
  return notification.post?._id ? `/safargram/post/${notification.post._id}` : "/notifications";
}

// A still image for the small thumbnail: photos as they are, videos via Cloudinary's frame.
export function thumbUrl(notification) {
  const thumb = notification.post?.thumb;
  if (!thumb?.url) return "";
  return thumb.type === "video" ? thumb.url.replace(/\.[a-z0-9]+$/i, ".jpg") : thumb.url;
}
