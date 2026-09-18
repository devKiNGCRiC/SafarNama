import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { addGroupMembers, removeGroupMember, renameGroup, searchUsers } from "../api";
import { displayName } from "../utils/chatText";
import ChatAvatar from "./ChatAvatar";
import "../chat.scss";

const messageOf = (e, fallback) => e?.response?.data?.message || fallback;

// Members list plus (for admins) rename, add and remove; anyone can leave.
const GroupInfoModal = ({ conv, myId, onClose, onUpdated, onLeft }) => {
  const me = conv.members.find((m) => String(m.user._id) === String(myId));
  const isAdmin = me?.role === "admin";
  const [name, setName] = useState(conv.name || "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const q = query.trim();
    if (!isAdmin || q.length < 2) {
      setResults([]);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const r = await searchUsers(q);
        const existing = new Set(conv.members.map((m) => String(m.user._id)));
        if (alive) setResults(r.data.filter((u) => !existing.has(String(u._id))));
      } catch {
        if (alive) setResults([]);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query, isAdmin, conv.members]);

  const run = async (action, fallback) => {
    try {
      return await action();
    } catch (e) {
      toast.error(messageOf(e, fallback));
      return null;
    }
  };

  const rename = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === conv.name) return;
    const r = await run(() => renameGroup(conv._id, name.trim()), "Could not rename the group");
    if (r) onUpdated(r.data);
  };
  const add = async (user) => {
    const r = await run(() => addGroupMembers(conv._id, [user._id]), "Could not add that person");
    if (r) {
      onUpdated(r.data);
      setQuery("");
    }
  };
  const remove = async (user) => {
    if (!window.confirm(`Remove ${displayName(user)} from the group?`)) return;
    const r = await run(() => removeGroupMember(conv._id, user._id), "Could not remove that person");
    if (r) onUpdated({ ...conv, members: conv.members.filter((m) => m.user._id !== user._id) });
  };
  const leave = async () => {
    if (!window.confirm("Leave this group?")) return;
    const r = await run(() => removeGroupMember(conv._id, myId), "Could not leave the group");
    if (r) onLeft();
  };

  return (
    <div className="chat-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="chat-modal">
        <div className="chat-modal-head">
          <h3>Group info</h3>
          <button type="button" className="chat-iconbtn" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {isAdmin ? (
          <form onSubmit={rename} className="chat-inline">
            <input className="chat-search" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} />
            <button className="chat-btn" disabled={!name.trim() || name.trim() === conv.name}>Rename</button>
          </form>
        ) : (
          <p><strong>{conv.name}</strong></p>
        )}

        <div className="chat-results">
          {conv.members.map((m) => (
            <div className="chat-item static" key={m.user._id}>
              <ChatAvatar user={m.user} size={38} />
              <span className="chat-item-text">
                <span className="chat-item-top">
                  <strong>{displayName(m.user)}{String(m.user._id) === String(myId) ? " (you)" : ""}</strong>
                  {m.role === "admin" && <small>Admin</small>}
                </span>
                <span className="chat-preview">@{m.user.username}</span>
              </span>
              {isAdmin && m.role !== "admin" && (
                <button type="button" className="chat-link" onClick={() => remove(m.user)}>Remove</button>
              )}
            </div>
          ))}
        </div>

        {isAdmin && (
          <>
            <input
              className="chat-search"
              placeholder="Add people…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {results.map((u) => (
              <button type="button" key={u._id} className="chat-item" onClick={() => add(u)}>
                <ChatAvatar user={u} size={38} />
                <span className="chat-item-text">
                  <span className="chat-item-top"><strong>{displayName(u)}</strong></span>
                  <span className="chat-preview">@{u.username} · tap to add</span>
                </span>
              </button>
            ))}
          </>
        )}

        <button type="button" className="chat-btn danger" onClick={leave}>Leave group</button>
      </div>
    </div>
  );
};

export default GroupInfoModal;
