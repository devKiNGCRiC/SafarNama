import { API_URL } from "../../config/api";

// One authenticated socket for the whole app. socket.io-client is ~100 KB, so it is loaded on
// demand here (dynamic import) instead of being bundled into every page - a logged-out visitor,
// or anyone just browsing destinations, never downloads it at all.
export async function openChatSocket(token) {
  const { io } = await import("socket.io-client");
  return io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelayMax: 10_000,
  });
}
