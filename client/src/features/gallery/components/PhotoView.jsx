import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Heart, MapPin, Share2, Trash2, Pencil } from "lucide-react";
import {
  addPhotoComment,
  deletePhoto,
  deletePhotoComment,
  getPhoto,
  likePhoto,
  unlikePhoto,
  updatePhoto,
} from "../api";
import { formatDay, photoAlt } from "../utils/galleryFormat";
import ReportButton from "../../reports/ReportButton";
import "../gallery.scss";

// One photo, big: picture, owner, caption, like / share, comments and (for the owner) edit / delete.
// Used both inside the lightbox and on the /gallery/:id page. `photo` is the card already known;
// the comments are fetched here. `onChange(card)` / `onDeleted(id)` keep the grid behind it in sync.
const PhotoView = ({ photo, onChange, onDeleted }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const myId = String(user?.id || user?._id || "");
  const isAdmin = user?.role === "admin";

  const [detail, setDetail] = useState({ ...photo, comments: null });
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ caption: "", location: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setDetail({ ...photo, comments: null });
    setEditing(false);
    getPhoto(photo._id)
      .then((r) => alive && setDetail(r.data))
      .catch(() => alive && setDetail((d) => ({ ...d, comments: [] })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo._id]);

  const push = (next) => {
    setDetail(next);
    const { comments, ...card } = next; // eslint-disable-line no-unused-vars
    onChange?.(card);
  };

  const needLogin = (what) => {
    toast.error(`Please log in to ${what}`);
    navigate("/auth", { state: { from: location } });
  };

  const isOwner = detail.owner && String(detail.owner._id) === myId;
  const comments = detail.comments || [];

  const toggleLike = async () => {
    if (!isAuthenticated) return needLogin("like photos");
    try {
      const res = detail.likedByMe ? await unlikePhoto(detail._id) : await likePhoto(detail._id);
      push({ ...detail, ...res.data });
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update your like");
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/gallery/${detail._id}`;
    try {
      if (navigator.share) await navigator.share({ title: photoAlt(detail), url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return needLogin("comment");
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const res = await addPhotoComment(detail._id, draft);
      push({ ...detail, comments: [...comments, res.data], commentCount: detail.commentCount + 1 });
      setDraft("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not post your comment");
    } finally {
      setPosting(false);
    }
  };

  const removeComment = async (comment) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deletePhotoComment(detail._id, comment._id);
      push({ ...detail, comments: comments.filter((c) => c._id !== comment._id), commentCount: detail.commentCount - 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the comment");
    }
  };

  const startEdit = () => {
    setEdit({ caption: detail.caption, location: detail.location });
    setEditing(true);
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updatePhoto(detail._id, edit);
      push({ ...detail, caption: res.data.caption, location: res.data.location });
      setEditing(false);
      toast.success("Photo updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your changes");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this photo? Its likes and comments will be lost.")) return;
    try {
      await deletePhoto(detail._id);
      toast.success("Photo deleted");
      onDeleted?.(detail._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the photo");
    }
  };

  return (
    <div className="gl-view">
      <div className="gl-view-image">
        <img src={detail.url} alt={photoAlt(detail)} />
      </div>

      <div className="gl-view-side">
        <header className="gl-owner">
          {detail.owner && (
            <Link to={`/profile/${detail.owner.username}`} className="gl-owner-link">
              <span className="gl-avatar">
                {detail.owner.avatar ? <img src={detail.owner.avatar} alt="" /> : <b>{detail.owner.username[0]?.toUpperCase()}</b>}
              </span>
              <span>
                <strong>{detail.owner.username}</strong>
                <small>{formatDay(detail.createdAt)}</small>
              </span>
            </Link>
          )}
          {(isOwner || isAdmin) && (
            <span className="gl-owner-actions">
              {isOwner && <button type="button" aria-label="Edit photo" onClick={startEdit}><Pencil size={17} /></button>}
              <button type="button" aria-label="Delete photo" onClick={remove}><Trash2 size={17} /></button>
            </span>
          )}
        </header>

        {editing ? (
          <form className="gl-edit" onSubmit={saveEdit}>
            <label htmlFor="gl-edit-caption">Caption</label>
            <textarea id="gl-edit-caption" rows={3} maxLength={300} value={edit.caption} onChange={(e) => setEdit({ ...edit, caption: e.target.value })} />
            <label htmlFor="gl-edit-location">Location</label>
            <input id="gl-edit-location" maxLength={80} value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} />
            <div className="gl-edit-actions">
              <button type="button" className="gl-btn ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="gl-btn" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </div>
          </form>
        ) : (
          <>
            {detail.caption && <p className="gl-caption">{detail.caption}</p>}
            {detail.location && <p className="gl-place"><MapPin size={15} /> {detail.location}</p>}
          </>
        )}

        <div className="gl-actions">
          <button type="button" className={`gl-btn ghost ${detail.likedByMe ? "liked" : ""}`} onClick={toggleLike}>
            <Heart size={16} fill={detail.likedByMe ? "currentColor" : "none"} /> {detail.likeCount}
          </button>
          <button type="button" className="gl-btn ghost" onClick={share}><Share2 size={16} /> Share</button>
          {!isOwner && <ReportButton type="GALLERY_PHOTO" targetId={detail._id} />}
        </div>

        <div className="gl-comments">
          <h3>Comments ({detail.commentCount})</h3>
          {detail.comments === null && <p className="gl-muted">Loading…</p>}
          {detail.comments && comments.length === 0 && <p className="gl-muted">No comments yet.</p>}
          <div className="gl-comment-list">
            {comments.map((c) => (
              <div key={c._id} className="gl-comment">
                <p>
                  <strong>{c.user?.username || "Deleted user"}</strong> {c.content}
                </p>
                <small>
                  {formatDay(c.createdAt)}
                  {(isAdmin || isOwner || (c.user && String(c.user._id) === myId)) && (
                    <button type="button" className="gl-link" onClick={() => removeComment(c)}>Delete</button>
                  )}
                </small>
              </div>
            ))}
          </div>
          {isAuthenticated ? (
            <form className="gl-comment-form" onSubmit={postComment}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} placeholder="Add a comment…" aria-label="Add a comment" />
              <button className="gl-btn" disabled={posting || !draft.trim()}>Post</button>
            </form>
          ) : (
            <p className="gl-muted"><button type="button" className="gl-link" onClick={() => needLogin("comment")}>Log in</button> to comment.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoView;
