import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { addComment, deleteComment, getComments } from "../api";
import useCursorList from "../hooks/useCursorList";
import { timeAgo } from "../utils/timeAgo";
import "../safargram.scss";

const CommentList = ({ postId, postAuthorId, onCountChange }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = String(me?.id || me?._id || "");
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getComments(postId, cursor),
    [postId],
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const { data } = await addComment(postId, value);
      setItems((list) => [data, ...list]);
      onCountChange?.(1);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post the comment");
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    try {
      await deleteComment(id);
      setItems((list) => list.filter((c) => c._id !== id));
      onCountChange?.(-1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the comment");
    }
  };

  const canDelete = (c) =>
    !!myId &&
    (String(c.author?._id) === myId || String(postAuthorId) === myId || me?.role === "admin");

  return (
    <div className="sg-comments">
      <form onSubmit={submit}>
        <input
          type="text"
          placeholder="Add a comment…"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="sg-btn" disabled={sending || !text.trim()}>Post</button>
      </form>

      {loading && <div className="sg-state">Loading comments…</div>}
      {error && <div className="sg-state">{error}</div>}
      {!loading && items.length === 0 && !error && <div className="sg-state">No comments yet.</div>}

      {items.map((c) => (
        <div className="sg-comment" key={c._id}>
          <div className="sg-comment-body">
            <strong>
              {c.author ? <Link to={`/profile/${c.author.username}`}>{c.author.username}</Link> : "deleted user"}
            </strong>{" "}
            {c.text}
            <small>{timeAgo(c.createdAt)}</small>
          </div>
          {canDelete(c) && (
            <button type="button" aria-label="Delete comment" onClick={() => remove(c._id)}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more comments"}
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
