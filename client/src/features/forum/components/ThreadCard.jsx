import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Heart, Lock, MessageCircle, Pin } from "lucide-react";
import { timeAgo } from "../../safargram/utils/timeAgo";
import { categoryLabel, replyCountText } from "../utils/forumFormat";
import "../forum.scss";

const ThreadCard = ({ thread }) => (
  <article className={`fm-card ${thread.isPinned ? "pinned" : ""}`}>
    <div className="fm-card-top">
      <span className="fm-cat">{categoryLabel(thread.category)}</span>
      {thread.isPinned && <span className="fm-badge pin"><Pin size={12} /> Pinned</span>}
      {thread.hasAcceptedAnswer && <span className="fm-badge ok"><CheckCircle2 size={12} /> Answered</span>}
      {thread.isLocked && <span className="fm-badge lock"><Lock size={12} /> Locked</span>}
    </div>
    <h3><Link to={`/forum/${thread._id}`}>{thread.title}</Link></h3>
    <p className="fm-excerpt">{thread.excerpt}</p>
    {thread.tags.length > 0 && (
      <div className="fm-tags">
        {thread.tags.map((t) => <Link key={t} to={`/forum?tag=${encodeURIComponent(t)}`}>#{t}</Link>)}
      </div>
    )}
    <div className="fm-meta">
      <span>{thread.author?.username || "Deleted user"} · {timeAgo(thread.createdAt)}</span>
      <span><MessageCircle size={14} /> {replyCountText(thread.replyCount)}</span>
      <span><Heart size={14} /> {thread.likeCount}</span>
    </div>
  </article>
);

export default ThreadCard;
