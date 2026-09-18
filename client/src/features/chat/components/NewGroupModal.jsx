import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { createGroup, searchUsers } from "../api";
import { displayName } from "../utils/chatText";
import ChatAvatar from "./ChatAvatar";
import "../chat.scss";

const NewGroupModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState([]); // users
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const r = await searchUsers(q);
        if (alive) setResults(r.data);
      } catch {
        if (alive) setResults([]);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const toggle = (user) =>
    setPicked((list) => (list.some((u) => u._id === user._id) ? list.filter((u) => u._id !== user._id) : [...list, user]));

  const create = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return toast.error("Give the group a name");
    if (picked.length < 2) return toast.error("Pick at least 2 people");
    setBusy(true);
    try {
      const r = await createGroup(name.trim(), picked.map((u) => u._id));
      onCreated(r.data._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the group");
      setBusy(false);
    }
  };

  return (
    <div className="chat-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="chat-modal" onSubmit={create}>
        <div className="chat-modal-head">
          <h3>New group</h3>
          <button type="button" className="chat-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <input
          className="chat-search"
          type="text"
          maxLength={50}
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="chat-members">
          {picked.map((u) => (
            <span className="chat-chip" key={u._id}>
              {displayName(u)}
              <button type="button" aria-label={`Remove ${u.username}`} onClick={() => toggle(u)}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <input
          className="chat-search"
          type="text"
          placeholder="Search people to add…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="chat-results">
          {results.map((u) => (
            <button type="button" key={u._id} className="chat-item" onClick={() => toggle(u)}>
              <ChatAvatar user={u} />
              <span className="chat-item-text">
                <span className="chat-item-top"><strong>{displayName(u)}</strong></span>
                <span className="chat-preview">@{u.username}{picked.some((p) => p._id === u._id) ? " ✓" : ""}</span>
              </span>
            </button>
          ))}
        </div>
        <button className="chat-btn" disabled={busy}>{busy ? "Creating…" : `Create group (${picked.length + 1})`}</button>
      </form>
    </div>
  );
};

export default NewGroupModal;
