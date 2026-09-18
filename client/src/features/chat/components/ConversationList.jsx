import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { PenSquare } from "lucide-react";
import useConversations from "../hooks/useConversations";
import { useChat } from "../ChatProvider";
import { timeAgo } from "../../safargram/utils/timeAgo";
import { displayName, previewText } from "../utils/chatText";
import ChatAvatar from "./ChatAvatar";
import "../chat.scss";

const titleOf = (c) => (c.type === "group" ? c.name : displayName(c.partner));

const ConversationList = ({ activeId, onOpen, onNewChat, extraActions }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = me?.id || me?._id;
  const { onlineIds, watchPresence } = useChat();
  const [tab, setTab] = useState("chats");
  const { items, loading, loadingMore, error, hasMore, loadMore, reload } = useConversations(tab);

  // Follow the online status of everyone we can see.
  useEffect(() => {
    watchPresence(items.filter((c) => c.partner).map((c) => c.partner._id));
  }, [items, watchPresence]);

  return (
    <div className="chat-list">
      <div className="chat-list-head">
        <h2>Messages</h2>
        <div className="chat-list-actions">
          {extraActions}
          <button type="button" className="chat-iconbtn" aria-label="New chat" onClick={onNewChat}>
            <PenSquare size={20} />
          </button>
        </div>
      </div>

      <div className="chat-tabs">
        <button className={tab === "chats" ? "active" : ""} onClick={() => setTab("chats")}>Chats</button>
        <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Requests</button>
      </div>

      <div className="chat-list-body">
        {loading && <div className="chat-empty">Loading…</div>}
        {error && items.length === 0 && (
          <div className="chat-empty">
            {error} <button className="chat-link" onClick={reload}>Try again</button>
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="chat-empty">
            {tab === "requests" ? "No message requests." : "No conversations yet. Start one with the pencil button."}
          </div>
        )}

        {items.map((c) => (
          <button
            type="button"
            key={c._id}
            className={`chat-item ${c._id === activeId ? "active" : ""}`}
            onClick={() => onOpen(c._id)}
          >
            <ChatAvatar user={c.partner} name={titleOf(c)} online={c.partner && onlineIds.has(String(c.partner._id))} />
            <span className="chat-item-text">
              <span className="chat-item-top">
                <strong>{titleOf(c)}</strong>
                <small>{c.lastMessage?.at ? timeAgo(c.lastMessage.at) : ""}</small>
              </span>
              <span className="chat-item-bottom">
                <span className={`chat-preview ${c.unreadCount ? "unread" : ""}`}>
                  {previewText(c.lastMessage, myId)}
                </span>
                {c.unreadCount > 0 && <span className="chat-badge">{c.unreadCount > 99 ? "99+" : c.unreadCount}</span>}
              </span>
            </span>
          </button>
        ))}

        {hasMore && (
          <button className="chat-link center" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
