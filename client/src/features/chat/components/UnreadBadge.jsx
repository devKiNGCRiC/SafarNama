import React from "react";
import { useChat } from "../ChatProvider";
import "../chat.scss";

// Small red counter for the navbar "Chat" link.
const UnreadBadge = () => {
  const { totalUnread } = useChat();
  if (!totalUnread) return null;
  return <span className="chat-badge nav">{totalUnread > 99 ? "99+" : totalUnread}</span>;
};

export default UnreadBadge;
