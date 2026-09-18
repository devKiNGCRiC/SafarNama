import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { Bookmark, Heart, MapPin, MessageCircle, Trash2 } from "lucide-react";
import { deletePost, likePost, savePost, unlikePost, unsavePost } from "../api";
import { timeAgo } from "../utils/timeAgo";
import CaptionText from "./CaptionText";
import MediaCarousel from "./MediaCarousel";
import "../safargram.scss";

const PostCard = ({ post, onChange, onDeleted, detail = false }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = me?.id || me?._id;
  const busy = useRef(false); // ignore taps while a request is in flight

  const author = post.author;
  const authorName = author?.username || "deleted user";
  const canDelete = !!myId && (String(author?._id) === String(myId) || me?.role === "admin");

  const toggle = async (flag, countKey, on, off) => {
    if (busy.current) return;
    busy.current = true;
    const was = post[flag];
    const optimistic = { ...post, [flag]: !was };
    if (countKey) optimistic[countKey] = post[countKey] + (was ? -1 : 1);
    onChange(optimistic); // instant feedback
    try {
      await (was ? off(post._id) : on(post._id));
    } catch {
      onChange(post); // roll back
      toast.error("Could not update. Please try again.");
    } finally {
      busy.current = false;
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    try {
      await deletePost(post._id);
      toast.success("Post deleted");
      onDeleted(post._id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete the post");
    }
  };

  return (
    <article className="sg-card">
      <div className="sg-card-head">
        {author?.avatar ? (
          <img className="sg-avatar" src={author.avatar} alt="" />
        ) : (
          <span className="sg-avatar">{authorName[0]?.toUpperCase()}</span>
        )}
        <div className="sg-author">
          {author ? <Link to={`/profile/${author.username}`}>{author.username}</Link> : <strong>{authorName}</strong>}
          {post.destination && (
            <Link className="sg-place" to={`/safargram/destination/${post.destination._id}`}>
              <MapPin size={12} /> {post.destination.name}
            </Link>
          )}
        </div>
        {canDelete && (
          <button type="button" className="sg-delete" aria-label="Delete post" onClick={handleDelete}>
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <MediaCarousel media={post.media} />

      <div className="sg-actions">
        <button
          type="button"
          className={`sg-like ${post.likedByMe ? "on" : ""}`}
          aria-label={post.likedByMe ? "Unlike" : "Like"}
          onClick={() => toggle("likedByMe", "likesCount", likePost, unlikePost)}
        >
          <Heart size={24} />
        </button>
        <Link to={`/safargram/post/${post._id}`} aria-label="Comments">
          <MessageCircle size={24} />
        </Link>
        <button
          type="button"
          className={`sg-save ${post.savedByMe ? "on" : ""}`}
          onClick={() => toggle("savedByMe", null, savePost, unsavePost)}
        >
          <Bookmark size={22} /> {post.savedByMe ? "In Bucket List" : "Add to Bucket List"}
        </button>
      </div>

      <div className="sg-body">
        <div className="sg-likes">
          {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
        </div>
        {post.caption && (
          <div className="sg-caption">
            <strong>{authorName}</strong> <CaptionText text={post.caption} />
          </div>
        )}
        <div className="sg-meta">
          {post.category && post.category !== "Other" && <span className="sg-badge">{post.category}</span>}
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        {!detail && post.commentsCount > 0 && (
          <Link className="sg-viewall" to={`/safargram/post/${post._id}`}>
            View all {post.commentsCount} comments
          </Link>
        )}
      </div>
    </article>
  );
};

export default PostCard;
