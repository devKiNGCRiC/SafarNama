import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Eye, Trash2, X } from "lucide-react";
import { deleteStory, getStoryViewers, viewStory } from "../api";
import { advance, storyDurationMs, timeLeftLabel } from "../utils/storyFormat";
import "../stories.scss";

// Full-screen story player: progress bars across the top, tap left/right (or arrow keys) to
// move between stories, auto-advances, and the author sees who watched theirs.
const StoryViewer = ({ groups, position, onMove, onClose, onViewed, onDeleted }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = String(me?.id || me?._id || "");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewers, setViewers] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(0);

  const group = groups[position?.groupIndex];
  const story = group?.stories[position?.storyIndex];
  const isMine = story && String(story.author._id) === myId;
  const duration = story ? storyDurationMs(story) : 5000;

  // mark as watched once per story shown
  useEffect(() => {
    if (story && !story.viewedByMe && !isMine) {
      viewStory(story._id).then((r) => onViewed(story._id, r.data)).catch(() => {});
    }
    setViewers(null);
  }, [story?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // the progress bar / auto-advance clock
  useEffect(() => {
    if (!story) return undefined;
    setElapsed(0);
    startRef.current = Date.now();
    const tick = () => {
      if (paused) return;
      const pct = Math.min(100, ((Date.now() - startRef.current) / duration) * 100);
      setElapsed(pct);
      if (pct >= 100) step(1);
    };
    timerRef.current = setInterval(tick, 80);
    return () => clearInterval(timerRef.current);
  }, [story?._id, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const step = (direction) => {
    const next = advance(groups, position, direction);
    if (next) onMove(next);
    else onClose();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [groups, position]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadViewers = () => {
    setPaused(true);
    getStoryViewers(story._id)
      .then((r) => setViewers(r.data))
      .catch(() => toast.error("Could not load viewers"));
  };

  const remove = async () => {
    if (!window.confirm("Delete this story?")) return;
    try {
      await deleteStory(story._id);
      toast.success("Story deleted");
      onDeleted(story._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete the story");
    }
  };

  if (!story) return null;

  return (
    <div className="st-overlay st-viewer" role="dialog" aria-modal="true">
      <div className="st-viewer-frame">
        <div className="st-bars">
          {group.stories.map((s, i) => (
            <span key={s._id} className="st-bar">
              <i style={{ width: `${i < position.storyIndex ? 100 : i === position.storyIndex ? elapsed : 0}%` }} />
            </span>
          ))}
        </div>

        <header className="st-viewer-head">
          <Link to={`/profile/${group.author.username}`} className="st-viewer-author">
            <span className="st-viewer-avatar">{group.author.avatar ? <img src={group.author.avatar} alt="" /> : <b>{group.author.username[0]?.toUpperCase()}</b>}</span>
            <span>
              <strong>{group.author.username}</strong>
              <small>{timeLeftLabel(story.expiresAt)}</small>
            </span>
          </Link>
          <div className="st-viewer-tools">
            {isMine && <button type="button" onClick={remove} aria-label="Delete story"><Trash2 size={19} /></button>}
            <button type="button" onClick={onClose} aria-label="Close"><X size={22} /></button>
          </div>
        </header>

        <div
          className="st-viewer-media"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {story.media.type === "video" ? (
            <video src={story.media.url} autoPlay muted={false} playsInline />
          ) : (
            <img src={story.media.url} alt="" />
          )}
          <button type="button" className="st-tap left" aria-label="Previous story" onClick={() => step(-1)} />
          <button type="button" className="st-tap right" aria-label="Next story" onClick={() => step(1)} />
        </div>

        {story.caption && <p className="st-caption">{story.caption}</p>}

        {isMine && (
          <button type="button" className="st-viewer-count" onClick={loadViewers}>
            <Eye size={16} /> {story.viewerCount} {story.viewerCount === 1 ? "view" : "views"}
          </button>
        )}

        {viewers && (
          <div className="st-viewers-sheet" onMouseDown={(e) => e.target === e.currentTarget && (setViewers(null), setPaused(false))}>
            <div className="st-viewers-panel">
              <h3>Viewed by</h3>
              {viewers.length === 0 && <p className="st-sub">No one has watched this yet.</p>}
              {viewers.map((v) => (
                <div key={v.user._id} className="st-viewer-row">
                  <span className="st-viewer-avatar small">{v.user.avatar ? <img src={v.user.avatar} alt="" /> : <b>{v.user.username[0]?.toUpperCase()}</b>}</span>
                  <span>{v.user.username}</span>
                </div>
              ))}
              <button type="button" className="st-btn ghost" onClick={() => { setViewers(null); setPaused(false); }}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
