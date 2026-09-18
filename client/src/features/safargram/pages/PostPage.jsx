import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPost } from "../api";
import PostCard from "../components/PostCard";
import CommentList from "../components/CommentList";
import "../safargram.scss";

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setPost(null);
    setError("");
    getPost(id)
      .then((r) => alive && setPost(r.data))
      .catch(
        (e) =>
          alive &&
          setError(e.response?.status === 404 ? "This post no longer exists." : "Could not load the post."),
      );
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="sg-page">
      <div className="sg-column">
        <p><Link to="/safargram">← Back to SafarGram</Link></p>
        {error && <div className="sg-state">{error}</div>}
        {!post && !error && <div className="sg-state">Loading…</div>}
        {post && (
          <>
            <PostCard post={post} detail onChange={setPost} onDeleted={() => navigate("/safargram")} />
            <div className="sg-card" style={{ padding: 14 }}>
              <CommentList
                postId={post._id}
                postAuthorId={post.author?._id}
                onCountChange={(delta) =>
                  setPost((p) => ({ ...p, commentsCount: Math.max(0, p.commentsCount + delta) }))
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PostPage;
