import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { getUnreadCount } from "./api";
import { openChatSocket } from "./socket";

const ChatContext = createContext(null);

// Events that change what the unread badge should show.
const UNREAD_EVENTS = ["message:new", "conversation:updated", "conversation:removed", "message:read"];

export function ChatProvider({ children }) {
  const token = useSelector((state) => state.auth.token);
  const [connected, setConnected] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [onlineIds, setOnlineIds] = useState(() => new Set());

  const socketRef = useRef(null);
  const handlers = useRef(new Map()); // event -> Set<fn>
  const watched = useRef(new Set()); // user ids whose presence we follow
  const refreshTimer = useRef(null);

  const refreshUnread = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(async () => {
      try {
        const r = await getUnreadCount();
        setTotalUnread(r.data.total);
      } catch {
        /* badge is decorative; ignore failures */
      }
    }, 250);
  }, []);

  useEffect(() => {
    if (!token) {
      setTotalUnread(0);
      setOnlineIds(new Set());
      return undefined;
    }

    const socket = openChatSocket(token);
    socketRef.current = socket;

    const sendWatchList = () => {
      if (watched.current.size) socket.emit("presence:watch", { userIds: [...watched.current].slice(0, 100) });
    };

    socket.on("connect", () => {
      setConnected(true);
      sendWatchList(); // re-subscribe after every reconnect
      refreshUnread(); // catch up on anything missed while offline
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:state", ({ online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        watched.current.forEach((id) => next.delete(id));
        online.forEach((id) => next.add(id));
        return next;
      }),
    );
    socket.on("presence", ({ userId, online }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      }),
    );

    // Fan every event out to whoever subscribed, and keep the badge fresh.
    socket.onAny((event, payload) => {
      handlers.current.get(event)?.forEach((fn) => fn(payload));
      if (UNREAD_EVENTS.includes(event)) refreshUnread();
    });

    refreshUnread();
    return () => {
      clearTimeout(refreshTimer.current);
      socket.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token, refreshUnread]);

  const subscribe = useCallback((event, fn) => {
    if (!handlers.current.has(event)) handlers.current.set(event, new Set());
    handlers.current.get(event).add(fn);
    return () => handlers.current.get(event)?.delete(fn);
  }, []);

  const emit = useCallback((event, payload) => socketRef.current?.emit(event, payload), []);

  const watchPresence = useCallback((ids) => {
    const fresh = ids.map(String).filter((id) => !watched.current.has(id));
    if (fresh.length === 0) return;
    fresh.forEach((id) => watched.current.add(id));
    socketRef.current?.emit("presence:watch", { userIds: [...watched.current].slice(0, 100) });
  }, []);

  const value = useMemo(
    () => ({ connected, totalUnread, refreshUnread, onlineIds, watchPresence, subscribe, emit }),
    [connected, totalUnread, refreshUnread, onlineIds, watchPresence, subscribe, emit],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

const FALLBACK = {
  connected: false,
  totalUnread: 0,
  refreshUnread: () => {},
  onlineIds: new Set(),
  watchPresence: () => {},
  subscribe: () => () => {},
  emit: () => {},
};

// Safe outside a provider (e.g. logged-out pages): everything is a no-op.
export const useChat = () => useContext(ChatContext) || FALLBACK;
