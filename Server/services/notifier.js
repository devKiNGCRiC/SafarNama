import UserModel from "../Models/userModel.js"; // also needed by populate()
import "../Models/safargramPostModel.js";
import "../Models/forumThreadModel.js";
import Notification from "../Models/notificationModel.js";
import ChatBlock from "../Models/chatBlockModel.js";

// notification type -> the switch in Settings that controls it
const PREF_FOR = { like: "likes", comment: "comments", follow: "follows", reply: "replies" };

const ACTOR_FIELDS = "username firstName lastName avatar";

// The socket layer is created in index.js; it hands itself over here once at startup so
// controllers can just call notify() without knowing about sockets.
let realtime = null;
export const configureNotifier = (rt) => {
  realtime = rt;
};

export function serializeNotification(doc) {
  const n = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const first = n.post?.media?.[0];
  return {
    _id: n._id,
    type: n.type,
    actor: n.actor,
    thread: n.thread ? { _id: n.thread._id, title: n.thread.title } : null,
    post: n.post ? { _id: n.post._id, thumb: first ? { url: first.url, type: first.type } : null } : null,
    text: n.text || "",
    createdAt: n.createdAt,
    readAt: n.readAt || null,
  };
}

export const populateNotification = (query) =>
  query.populate("actor", ACTOR_FIELDS).populate("post", "media").populate("thread", "title");

// Creates a notification and pushes it live. It must NEVER break the action that caused
// it (a like should succeed even if notifying fails), so all errors are swallowed.
export async function notify({ recipient, actor, type, post, comment, thread, reply, text }) {
  try {
    if (!recipient || !actor || String(recipient) === String(actor)) return null; // never yourself
    if (await ChatBlock.exists({ blocker: recipient, blocked: actor })) return null; // they blocked you
    const prefs = await UserModel.findById(recipient).select("preferences.notifications").lean();
    if (prefs?.preferences?.notifications?.[PREF_FOR[type]] === false) return null; // turned off in Settings

    let doc;
    try {
      doc = await Notification.create({ recipient, actor, type, post, comment, thread, reply, text: text?.slice(0, 120) });
    } catch (error) {
      if (error.code === 11000) return null; // already notified (like / follow toggled again)
      throw error;
    }

    if (realtime) {
      const populated = await populateNotification(Notification.findById(doc._id));
      const unreadCount = await Notification.countDocuments({ recipient, readAt: null });
      realtime.emitToUsers([recipient], "notification:new", {
        notification: serializeNotification(populated),
        unreadCount,
      });
    }
    return doc;
  } catch (error) {
    console.error("notify failed:", error.message);
    return null;
  }
}

// Removes notifications that no longer make sense (unlike, unfollow, deleted comment/post).
export async function unnotify(filter) {
  try {
    await Notification.deleteMany(filter);
  } catch (error) {
    console.error("unnotify failed:", error.message);
  }
}
