import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useChat } from "../chat/ChatProvider";
import { getNotificationCount } from "./api";
import { actorName, describe } from "./utils/notificationText";

const Context = createContext(null);

// Keeps the unread count for the bell up to date, live: the server pushes
// "notification:new" over the same socket that chat uses.
export function NotificationsProvider({ children }) {
  const token = useSelector((state) => state.auth.token);
  const { subscribe } = useChat();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const r = await getNotificationCount();
      setUnread(r.data.total);
    } catch {
      /* the badge is decorative */
    }
  }, []);

  // load on login, reset on logout
  useEffect(() => {
    if (token) refresh();
    else setUnread(0);
  }, [token, refresh]);

  // live pushes
  useEffect(() => {
    if (!token) return undefined;
    return subscribe("notification:new", ({ notification, unreadCount }) => {
      setUnread(unreadCount);
      // a small pop-up unless the user is already looking at the list
      if (!window.location.pathname.startsWith("/notifications")) {
        toast(`${actorName(notification.actor)} ${describe(notification)}`, { icon: "🔔" });
      }
    });
  }, [token, subscribe]);

  const value = useMemo(() => ({ unread, setUnread, refresh }), [unread, refresh]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

// Safe outside the provider (logged-out pages): everything is a no-op.
export const useNotifications = () =>
  useContext(Context) || { unread: 0, setUnread: () => {}, refresh: () => {} };
