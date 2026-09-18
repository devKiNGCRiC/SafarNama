import React from "react";
import { RotateCw } from "lucide-react";
import { displayName } from "../utils/chatText";
import "../chat.scss";

const time = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const MessageBubble = ({ message, mine, grouped, showSender, seen, onRetry }) => {
  if (message.kind === "system") {
    return <div className="chat-system">{message.text}</div>;
  }

  return (
    <div className={`chat-row ${mine ? "mine" : "theirs"} ${grouped ? "grouped" : ""}`}>
      <div className={`chat-bubble ${message.failed ? "failed" : ""} ${message.pending ? "pending" : ""}`}>
        {showSender && !mine && !grouped && (
          <span className="chat-sender">{displayName(message.sender)}</span>
        )}
        {message.media && (
          <a href={message.media.url} target="_blank" rel="noreferrer">
            <img className="chat-photo" src={message.media.url} alt="Sent photo" loading="lazy" />
          </a>
        )}
        {message.text && message.text !== "Photo" && <span className="chat-text">{message.text}</span>}
        <span className="chat-time">
          {message.pending ? "Sending…" : time(message.createdAt)}
          {mine && seen && !message.pending && !message.failed && " · Seen"}
        </span>
      </div>
      {message.failed && (
        <button type="button" className="chat-retry" onClick={() => onRetry(message)}>
          <RotateCw size={14} /> Retry
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
