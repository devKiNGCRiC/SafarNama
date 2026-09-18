import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { searchUsers, startDirect } from "../api";
import { displayName } from "../utils/chatText";
import ChatAvatar from "./ChatAvatar";
import "../chat.scss";

const NewChatModal = ({ onClose, onOpened }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const r = await searchUsers(q);
        if (alive) setResults(r.data);
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = async (user) => {
    if (starting) return;
    setStarting(true);
    try {
      const r = await startDirect(user._id);
      onOpened(r.data._id);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not start the chat");
      setStarting(false);
    }
  };

  return (
    <div className="chat-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chat-modal">
        <div className="chat-modal-head">
          <h3>New message</h3>
          <button type="button" className="chat-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <input
          autoFocus
          className="chat-search"
          type="text"
          placeholder="Search by username…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chat-results">
          {query.trim().length < 2 && <div className="chat-empty">Type at least 2 letters.</div>}
          {searching && <div className="chat-empty">Searching…</div>}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="chat-empty">No one found.</div>
          )}
          {results.map((u) => (
            <button type="button" key={u._id} className="chat-item" onClick={() => open(u)} disabled={starting}>
              <ChatAvatar user={u} />
              <span className="chat-item-text">
                <span className="chat-item-top"><strong>{displayName(u)}</strong></span>
                <span className="chat-preview">@{u.username}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
