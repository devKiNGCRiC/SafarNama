import React from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, MessageCircle, Play } from "lucide-react";
import "../safargram.scss";

const thumbOf = (post) => {
  const first = post.media?.[0];
  if (!first) return "";
  // Cloudinary can render a still frame of a video by swapping the extension.
  return first.type === "video" ? first.url.replace(/\.[a-z0-9]+$/i, ".jpg") : first.url;
};

const PostGrid = ({ posts, loading, emptyText = "No posts yet." }) => {
  if (loading) return <div className="sg-state">Loading…</div>;
  if (!posts.length) return <div className="sg-state">{emptyText}</div>;
  return (
    <div className="sg-grid">
      {posts.map((post) => (
        <Link key={post._id} className="sg-thumb" to={`/safargram/post/${post._id}`}>
          <img src={thumbOf(post)} alt="" loading="lazy" />
          {post.media?.[0]?.type === "video" && <Play className="sg-thumb-icon" size={18} />}
          {post.media?.length > 1 && <Copy className="sg-thumb-icon" size={18} />}
          <span className="sg-thumb-stats">
            <span><Heart size={16} /> {post.likesCount}</span>
            <span><MessageCircle size={16} /> {post.commentsCount}</span>
          </span>
        </Link>
      ))}
    </div>
  );
};

export default PostGrid;
