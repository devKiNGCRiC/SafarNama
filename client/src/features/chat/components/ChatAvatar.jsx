import React from "react";
import { displayName } from "../utils/chatText";
import "../chat.scss";

// Round avatar with a fallback initial and an optional green "online" dot.
const ChatAvatar = ({ user, name, size = 44, online = false }) => {
  const label = name || displayName(user);
  return (
    <span className="chat-avatar" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user?.avatar ? <img src={user.avatar} alt="" /> : <b>{label[0]?.toUpperCase()}</b>}
      {online && <i className="chat-online" aria-label="Online" />}
    </span>
  );
};

export default ChatAvatar;
