import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Bookmark, Heart, Lock, Pin, Share2 } from "lucide-react";
import useCursorList from "../../safargram/hooks/useCursorList";
import {
  acceptReply,
  clearAccepted,
  createReply,
  deleteThread,
  getReplies,
  getThread,
  likeThread,
  saveThread,
  setLocked,
  setPinned,
  unlikeThread,
  unsaveThread,
} from "../api";
import ReplyItem from "../components/ReplyItem";
import ThreadForm from "../components/ThreadForm";
import useRequireLogin from "../hooks/useRequireLogin";
import { timeAgo } from "../../safargram/utils/timeAgo";
import { categoryLabel, replyCountText, splitParagraphs, threadBadges, withAcceptedFirst } from "../utils/forumFormat";
import "../forum.scss";

const ThreadPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const myId = String(user?.id || user?._id || "");
  const isAdmin = user?.role === "admin";

  const [thread, setThread] = useState(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;
    setThread(null);
    setError("");
    getThread(id)
      .then((r) => alive && setThread(r.data))
      .catch((e) => alive && setError(e.response?.status === 404 ? "This discussion does not exist (any more)." : "Could not load the discussion."));
    return () => {
      alive = false;
    };
  }, [id]);

  const replies = useCursorList((cursor) => getReplies(id, cursor), [id]);

  const change = (patch) => setThread((t) => ({ ...t, ...patch }));
  const isOwner = thread?.author && String(thread.author._id) === myId;
  const canEdit = isOwner || isAdmin;

  const run = async (call, onDone, failText) => {
    try {
      const res = await call();
      onDone(res.data);
    } catch (e) {
      toast.error(e.response?.data?.message || failText);
    }
  };

  const toggleLike = () =>
    requireLogin("like discussions") &&
    run(() => (thread.likedByMe ? unlikeThread(id) : likeThread(id)), (d) => change({ likeCount: d.likeCount, likedByMe: d.likedByMe }), "Could not update your like");

  const toggleSave = () =>
    requireLogin("save discussions") &&
    run(() => (thread.savedByMe ? unsaveThread(id) : saveThread(id)), (d) => {
      change({ savedByMe: d.savedByMe });
      toast.success(d.savedByMe ? "Saved to your list" : "Removed from your saved list");
    }, "Could not update your saved list");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: thread.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this discussion and all its replies?")) return;
    try {
      await deleteThread(id);
      toast.success("Discussion deleted");
      navigate("/forum", { replace: true });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete the discussion");
    }
  };

  const togglePin = () => run(() => setPinned(id, !thread.isPinned), (d) => change({ isPinned: d.isPinned }), "Could not change the pin");
  const toggleLock = () => run(() => setLocked(id, !thread.isLocked), (d) => change({ isLocked: d.isLocked }), "Could not change the lock");

  const markAnswer = (reply) =>
    run(() => acceptReply(id, reply._id), (d) => {
      change({ acceptedReplyId: d.acceptedReplyId, hasAcceptedAnswer: true });
      replies.setItems((list) => list.map((r) => ({ ...r, isAccepted: r._id === reply._id })));
    }, "Could not mark the answer");
  const unmarkAnswer = () =>
    run(() => clearAccepted(id), () => {
      change({ acceptedReplyId: null, hasAcceptedAnswer: false });
      replies.setItems((list) => list.map((r) => ({ ...r, isAccepted: false })));
    }, "Could not remove the mark");

  const postReply = async (e) => {
    e.preventDefault();
    if (!requireLogin("reply") || !draft.trim() || posting) return;
    setPosting(true);
    try {
      const res = await createReply(id, draft);
      replies.setItems((list) => [...list, res.data]);
      change({ replyCount: thread.replyCount + 1 });
      setDraft("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post your reply");
    } finally {
      setPosting(false);
    }
  };

  const replyDeleted = (replyId) => {
    replies.setItems((list) => list.filter((r) => r._id !== replyId));
    change({
      replyCount: Math.max(0, thread.replyCount - 1),
      ...(String(thread.acceptedReplyId) === String(replyId) ? { acceptedReplyId: null, hasAcceptedAnswer: false } : {}),
    });
  };

  if (error) {
    return <div className="fm-page"><div className="fm-wrap fm-state">{error} <Link to="/forum">Back to the forum</Link></div></div>;
  }
  if (!thread) return <div className="fm-page"><div className="fm-wrap fm-state">Loading…</div></div>;

  const shown = withAcceptedFirst(replies.items).map((r) => ({ ...r, isMine: Boolean(r.author) && String(r.author._id) === myId }));

  return (
    <div className="fm-page">
      <div className="fm-wrap narrow">
        <p><Link to="/forum">← All discussions</Link></p>

        <article className="fm-thread">
          <div className="fm-card-top">
            <span className="fm-cat">{categoryLabel(thread.category)}</span>
            {threadBadges(thread).map((b) => <span key={b.id} className={`fm-badge ${b.id}`}>{b.label}</span>)}
          </div>
          <h1>{thread.title}</h1>
          <div className="fm-byline">
            {thread.author ? <Link to={`/profile/${thread.author.username}`}><strong>{thread.author.username}</strong></Link> : <strong>Deleted user</strong>}
            <span>{timeAgo(thread.createdAt)}{thread.editedAt ? " · edited" : ""}</span>
            <span>{replyCountText(thread.replyCount)}</span>
          </div>

          <div className="fm-body">{splitParagraphs(thread.content).map((p, i) => <p key={i}>{p}</p>)}</div>

          {thread.tags.length > 0 && (
            <div className="fm-tags">{thread.tags.map((t) => <Link key={t} to={`/forum?tag=${encodeURIComponent(t)}`}>#{t}</Link>)}</div>
          )}

          <div className="fm-actions">
            <button type="button" className={`fm-btn ghost ${thread.likedByMe ? "liked" : ""}`} onClick={toggleLike}>
              <Heart size={16} fill={thread.likedByMe ? "currentColor" : "none"} /> {thread.likeCount}
            </button>
            <button type="button" className={`fm-btn ghost ${thread.savedByMe ? "saved" : ""}`} onClick={toggleSave}>
              <Bookmark size={16} fill={thread.savedByMe ? "currentColor" : "none"} /> {thread.savedByMe ? "Saved" : "Save"}
            </button>
            <button type="button" className="fm-btn ghost" onClick={share}><Share2 size={16} /> Share</button>
            {canEdit && <button type="button" className="fm-btn ghost" onClick={() => setEditing(true)}>Edit</button>}
            {canEdit && <button type="button" className="fm-btn ghost danger" onClick={remove}>Delete</button>}
            {isAdmin && (
              <>
                <button type="button" className="fm-btn ghost" onClick={togglePin}><Pin size={16} /> {thread.isPinned ? "Unpin" : "Pin"}</button>
                <button type="button" className="fm-btn ghost" onClick={toggleLock}><Lock size={16} /> {thread.isLocked ? "Unlock" : "Lock"}</button>
              </>
            )}
          </div>
        </article>

        <section className="fm-replies">
          <h2>{replyCountText(thread.replyCount)}</h2>

          {replies.loading && <p className="fm-muted">Loading replies…</p>}
          {replies.error && <p className="fm-muted">{replies.error}</p>}
          {shown.map((r) => (
            <ReplyItem
              key={r._id}
              reply={r}
              canModerate={isAdmin || isOwner}
              canAccept={isOwner || isAdmin}
              onChange={(next) => replies.setItems((list) => list.map((x) => (x._id === next._id ? { ...x, ...next } : x)))}
              onDeleted={replyDeleted}
              onAccept={markAnswer}
              onUnaccept={unmarkAnswer}
            />
          ))}
          {replies.hasMore && (
            <div className="fm-more">
              <button type="button" className="fm-btn ghost" onClick={replies.loadMore} disabled={replies.loadingMore}>
                {replies.loadingMore ? "Loading…" : "Show more replies"}
              </button>
            </div>
          )}

          {thread.isLocked ? (
            <p className="fm-locked"><Lock size={15} /> This discussion is locked. New replies are turned off.</p>
          ) : isAuthenticated ? (
            <form className="fm-reply-form" onSubmit={postReply}>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={2000} placeholder="Write a reply…" aria-label="Write a reply" />
              <button className="fm-btn" disabled={posting || !draft.trim()}>{posting ? "Posting…" : "Reply"}</button>
            </form>
          ) : (
            <p className="fm-muted"><button type="button" className="fm-link" onClick={() => requireLogin("reply")}>Log in</button> to join the discussion.</p>
          )}
        </section>
      </div>

      {editing && (
        <ThreadForm
          thread={thread}
          onClose={() => setEditing(false)}
          onSaved={(updated) => {
            change(updated);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
};

export default ThreadPage;
