import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Heart, Share2 } from "lucide-react";
import { addGuideComment, deleteGuideComment, getGuide, likeGuide, unlikeGuide } from "../api";
import { categoryLabel, formatDay, readTimeText, splitParagraphs } from "../utils/guideFormat";
import "../../events/events.scss";
import "../guides.scss";

const GuideDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const myId = String(user?.id || user?._id || "");
  const isAdmin = user?.role === "admin";

  const [guide, setGuide] = useState(null);
  const [error, setError] = useState("");
  const [liking, setLiking] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let alive = true;
    setGuide(null);
    setError("");
    getGuide(id)
      .then((r) => alive && setGuide(r.data))
      .catch((e) => alive && setError(e.response?.status === 404 ? "This guide does not exist (any more)." : "Could not load the guide."));
    return () => {
      alive = false;
    };
  }, [id]);

  const needLogin = (what) => {
    toast.error(`Please log in to ${what}`);
    navigate("/auth", { state: { from: location } });
  };

  const toggleLike = async () => {
    if (!isAuthenticated) return needLogin("like guides");
    if (liking) return;
    setLiking(true);
    try {
      const res = guide.likedByMe ? await unlikeGuide(guide._id) : await likeGuide(guide._id);
      setGuide((g) => ({ ...g, ...res.data }));
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update your like");
    } finally {
      setLiking(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: guide.title, url });
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
      const res = await addGuideComment(guide._id, draft);
      setGuide((g) => ({ ...g, comments: [...g.comments, res.data], commentCount: g.commentCount + 1 }));
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
      await deleteGuideComment(guide._id, comment._id);
      setGuide((g) => ({ ...g, comments: g.comments.filter((c) => c._id !== comment._id), commentCount: g.commentCount - 1 }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the comment");
    }
  };

  if (error) {
    return (
      <div className="ev-page">
        <div className="ev-wrap ev-state">{error} <Link to="/eco-guides">Back to guides</Link></div>
      </div>
    );
  }
  if (!guide) return <div className="ev-page"><div className="ev-wrap ev-state">Loading…</div></div>;

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <p><Link to="/eco-guides">← All guides</Link></p>
        <article className="gd-article">
          {guide.cover && <div className="gd-hero"><img src={guide.cover} alt="" /></div>}
          <div className="gd-article-body">
            <span className="ev-type-pill">{categoryLabel(guide.category)}</span>
            <h1>{guide.title}</h1>
            <div className="gd-byline">
              {guide.author && <span>By <strong>{guide.author.username}</strong></span>}
              <span>{formatDay(guide.createdAt)}</span>
              <span>{readTimeText(guide.readMinutes)}</span>
            </div>

            <div className="gd-text">
              {splitParagraphs(guide.content).map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {guide.tags.length > 0 && (
              <div className="gd-tags">
                {guide.tags.map((t) => <Link key={t} to={`/eco-guides?tag=${encodeURIComponent(t)}`}>#{t}</Link>)}
              </div>
            )}

            <div className="gd-actions">
              <button type="button" className={`ev-btn ghost gd-like ${guide.likedByMe ? "liked" : ""}`} onClick={toggleLike} disabled={liking}>
                <Heart size={16} style={{ verticalAlign: "-3px" }} fill={guide.likedByMe ? "currentColor" : "none"} /> {guide.likeCount}
              </button>
              <button type="button" className="ev-btn ghost" onClick={share}>
                <Share2 size={16} style={{ verticalAlign: "-3px" }} /> Share
              </button>
            </div>
          </div>
        </article>

        <section className="gd-comments">
          <h2>Comments ({guide.comments.length})</h2>
          {isAuthenticated ? (
            <form onSubmit={postComment}>
              <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={500} placeholder="Add a comment…" rows={2} />
              <button className="ev-btn" disabled={posting || !draft.trim()}>{posting ? "Posting…" : "Post"}</button>
            </form>
          ) : (
            <p><button type="button" className="ev-link" onClick={() => needLogin("comment")}>Log in</button> to join the conversation.</p>
          )}

          {guide.comments.length === 0 && <p className="gd-empty">No comments yet. Be the first!</p>}
          {guide.comments.map((c) => (
            <div key={c._id} className="gd-comment">
              <header>
                <span><strong>{c.user?.username || "Deleted user"}</strong><small>{formatDay(c.createdAt)}</small></span>
                {(isAdmin || (c.user && String(c.user._id) === myId)) && (
                  <button type="button" className="ev-link" onClick={() => removeComment(c)}>Delete</button>
                )}
              </header>
              <p>{c.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default GuideDetailPage;
