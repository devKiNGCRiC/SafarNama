import React from "react";
import { timeAgo } from "../../safargram/utils/timeAgo";
import { actorName, describe, thumbUrl } from "../utils/notificationText";
import "../notifications.scss";

// One row: avatar, "who did what", when, and the post thumbnail. Unread rows are highlighted.
const NotificationItem = ({ notification, onOpen }) => {
  const { actor, createdAt, readAt } = notification;
  const thumb = thumbUrl(notification);

  return (
    <button
      type="button"
      className={`nt-item ${readAt ? "" : "unread"}`}
      onClick={() => onOpen(notification)}
    >
      {actor?.avatar ? (
        <img className="nt-avatar" src={actor.avatar} alt="" />
      ) : (
        <span className="nt-avatar">{actorName(actor)[0]?.toUpperCase()}</span>
      )}
      <span className="nt-text">
        <strong>{actorName(actor)}</strong> {describe(notification)}
        <small>{timeAgo(createdAt)}</small>
      </span>
      {thumb && <img className="nt-thumb" src={thumb} alt="" loading="lazy" />}
      {!readAt && <i className="nt-dot" aria-label="Unread" />}
    </button>
  );
};

export default NotificationItem;
