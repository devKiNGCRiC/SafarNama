import React from "react";
import { Link } from "react-router-dom";
import { Heart, Leaf, MessageCircle } from "lucide-react";
import { categoryLabel, formatDay, readTimeText } from "../utils/guideFormat";
import "../guides.scss";

const GuideCard = ({ guide }) => (
  <article className="gd-card">
    <Link to={`/eco-guides/${guide._id}`} className="gd-cover" aria-label={guide.title}>
      {guide.cover ? (
        <img src={guide.cover} alt="" loading="lazy" />
      ) : (
        <span className="gd-cover-fallback"><Leaf size={46} /></span>
      )}
      <span className="gd-cat">{categoryLabel(guide.category)}</span>
    </Link>
    <div className="gd-body">
      <h3><Link to={`/eco-guides/${guide._id}`}>{guide.title}</Link></h3>
      <p className="gd-excerpt">{guide.excerpt}</p>
      <div className="gd-meta">
        <span>{formatDay(guide.createdAt)}</span>
        <span>{readTimeText(guide.readMinutes)}</span>
        <span><Heart size={14} /> {guide.likeCount}</span>
        <span><MessageCircle size={14} /> {guide.commentCount}</span>
      </div>
    </div>
  </article>
);

export default GuideCard;
