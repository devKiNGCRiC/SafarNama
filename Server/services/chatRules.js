import Profile from "../Models/profileModel.js";
import ChatBlock from "../Models/chatBlockModel.js";

// While the other person has not accepted a request, the requester may send this many.
export const PENDING_MESSAGE_LIMIT = 3;

export const directKeyFor = (a, b) => [String(a), String(b)].sort().join(":");

// Chats between connected users go straight to the inbox; strangers become requests.
export const initialStatusFor = (connected) => (connected ? "active" : "pending");

// True when either user follows the other (Profile.following).
export async function usersAreConnected(aId, bId) {
  const hit = await Profile.exists({
    $or: [
      { user: aId, following: bId },
      { user: bId, following: aId },
    ],
  });
  return !!hit;
}

export async function blockState(meId, otherId) {
  const [byMe, byThem] = await Promise.all([
    ChatBlock.exists({ blocker: meId, blocked: otherId }),
    ChatBlock.exists({ blocker: otherId, blocked: meId }),
  ]);
  return { blockedByMe: !!byMe, blockedMe: !!byThem };
}
