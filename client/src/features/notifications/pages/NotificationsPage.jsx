import React from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../api";
import useCursorList from "../../safargram/hooks/useCursorList";
import { useNotifications } from "../NotificationsProvider";
import { targetPath } from "../utils/notificationText";
import NotificationItem from "../components/NotificationItem";
import "../notifications.scss";

// Full list of notifications, newest first, with "load more".
const NotificationsPage = () => {
  const navigate = useNavigate();
  const { unread, setUnread, refresh } = useNotifications();
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore, reload } = useCursorList(
    (cursor) => getNotifications(cursor),
    [],
  );

  const open = (n) => {
    if (!n.readAt) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, readAt: new Date().toISOString() } : x)));
      markNotificationRead(n._id).then(refresh).catch(() => {});
    }
    navigate(targetPath(n));
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() })));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="nt-page">
      <div className="nt-page-card">
        <div className="nt-page-head">
          <h1>Notifications</h1>
          {unread > 0 && (
            <button type="button" className="nt-btn" onClick={markAll}>
              Mark all as read
            </button>
          )}
        </div>

        {loading && <div className="nt-empty">Loading…</div>}
        {error && items.length === 0 && (
          <div className="nt-empty">
            {error} <button className="nt-link" onClick={reload}>Try again</button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="nt-empty">
            Nothing yet. When someone likes or comments on your SafarGram posts, or follows you, it will appear here.
          </div>
        )}

        {items.map((n) => (
          <NotificationItem key={n._id} notification={n} onOpen={open} />
        ))}

        {hasMore && (
          <button type="button" className="nt-btn ghost center" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
