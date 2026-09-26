import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api";
import { useNotifications } from "../NotificationsProvider";
import { targetPath } from "../utils/notificationText";
import NotificationItem from "./NotificationItem";
import "../notifications.scss";

const label = (n) => (n > 99 ? "99+" : String(n));

// Red counter for menu links (mobile menu).
export const NotificationCount = () => {
  const { unread } = useNotifications();
  return unread > 0 ? <span className="nt-count">{label(unread)}</span> : null;
};

// The bell in the top bar: badge with the unread count and a dropdown with the latest ones.
const NotificationBell = () => {
  const { unread, setUnread, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = loading
  const root = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const load = useCallback(async () => {
    try {
      const r = await getNotifications(null, 8);
      setItems(r.data);
    } catch {
      setItems([]);
    }
  }, []);

  // refresh the list every time the panel opens (and when a new one arrives while open)
  useEffect(() => {
    if (open) load();
  }, [open, unread, load]);

  // close on outside click, Escape and navigation
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => root.current && !root.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  const openNotification = async (n) => {
    setOpen(false);
    if (!n.readAt) {
      markNotificationRead(n._id).then(refresh).catch(() => {});
    }
    navigate(targetPath(n));
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((list) => list?.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="nt-bell" ref={root}>
      <button
        type="button"
        className="nt-bell-btn"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={22} />
        {unread > 0 && <span className="nt-count">{label(unread)}</span>}
      </button>

      {open && (
        <div className="nt-panel" role="dialog" aria-label="Notifications">
          <div className="nt-panel-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button type="button" className="nt-link" onClick={markAll}>
                Mark all as read
              </button>
            )}
          </div>
          <div className="nt-panel-body">
            {items === null && <div className="nt-empty">Loading…</div>}
            {items && items.length === 0 && (
              <div className="nt-empty">You are all caught up. Likes, comments and new followers will show up here.</div>
            )}
            {items?.map((n) => (
              <NotificationItem key={n._id} notification={n} onOpen={openNotification} />
            ))}
          </div>
          <Link to="/notifications" className="nt-panel-foot">
            See all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
