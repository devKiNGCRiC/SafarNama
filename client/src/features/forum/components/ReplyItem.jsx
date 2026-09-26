import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Heart } from "lucide-react";
import { deleteReply, likeReply, unlikeReply, updateReply } from "../api";
import { timeAgo } from "../../safargram/utils/timeAgo";
import useRequireLogin from "../hooks/useRequireLogin";
import "../forum.scss";

// One reply: like, edit / delete (own), delete (thread owner / admin), and mark as the answer.
const ReplyItem = ({ reply, canModerate, canAccept, onChange, onDeleted, onAccept, onUnaccept }) => {
  const requireLogin = useRequireLogin();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const isMine = reply.isMine;

  const toggleLike = async () => {
    if (!requireLogin("like replies")) return;
    try {
      const res = reply.likedByMe ? await unlikeReply(reply._id) : await likeReply(reply._id);
      onChange({ ...reply, ...res.data });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update your like");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      const res = await updateReply(reply._id, draft);
      onChange({ ...reply, content: res.data.content, editedAt: res.data.editedAt });
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your reply");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await deleteReply(reply._id);
      onDeleted(reply._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the reply");
    }
  };

  return (
    <div className={`fm-reply ${reply.isAccepted ? "accepted" : ""}`} id={`reply-${reply._id}`}>
      {reply.isAccepted && <div className="fm-accepted-tag"><CheckCircle2 size={15} /> Accepted answer</div>}
      <header>
        {reply.author ? (
          <Link to={`/profile/${reply.author.username}`}><strong>{reply.author.username}</strong></Link>
        ) : (
          <strong>Deleted user</strong>
        )}
        <small>{timeAgo(reply.createdAt)}{reply.editedAt ? " · edited" : ""}</small>
      </header>

      {editing ? (
        <form onSubmit={save} className="fm-reply-edit">
          <textarea rows={4} value={draft} maxLength={2000} onChange={(e) => setDraft(e.target.value)} />
          <div className="fm-inline-actions">
            <button type="button" className="fm-btn ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="fm-btn" disabled={busy || !draft.trim()}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      ) : (
        <p className="fm-reply-text">{reply.content}</p>
      )}

      {!editing && (
        <footer>
          <button type="button" className={`fm-link ${reply.likedByMe ? "on" : ""}`} onClick={toggleLike}>
            <Heart size={14} fill={reply.likedByMe ? "currentColor" : "none"} /> {reply.likeCount}
          </button>
          {canAccept && !reply.isAccepted && <button type="button" className="fm-link" onClick={() => onAccept(reply)}>Mark as answer</button>}
          {canAccept && reply.isAccepted && <button type="button" className="fm-link" onClick={onUnaccept}>Remove answer mark</button>}
          {isMine && (
            <button type="button" className="fm-link" onClick={() => { setDraft(reply.content); setEditing(true); }}>Edit</button>
          )}
          {(isMine || canModerate) && <button type="button" className="fm-link danger" onClick={remove}>Delete</button>}
        </footer>
      )}
    </div>
  );
};

export default ReplyItem;
