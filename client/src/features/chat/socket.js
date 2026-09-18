import { io } from "socket.io-client";
import { API_URL } from "../../config/api";

// One authenticated socket for the whole app. The server checks the same JWT as REST.
export function openChatSocket(token) {
  return io(API_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelayMax: 10_000,
  });
}
