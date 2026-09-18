import React, { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { getFeed } from "../api";
import useCursorList from "../hooks/useCursorList";
import Wordmark from "../components/Wordmark";
import PostCard from "../components/PostCard";
import CreatePostModal from "../components/CreatePostModal";
import "../safargram.scss";

function FeedList({ tab }) {
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore, reload } = useCursorList(
    (cursor) => getFeed(tab, cursor),
    [tab],
  );
  const replace = (post) => setItems((list) => list.map((p) => (p._id === post._id ? post : p)));
  const remove = (id) => setItems((list) => list.filter((p) => p._id !== id));

  if (loading) return <div className="sg-state">Loading…</div>;
  if (error && items.length === 0) {
    return (
      <div className="sg-state">
        {error}
        <div>
          <button className="sg-btn" onClick={reload}>Try again</button>
        </div>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="sg-state">
        {tab === "following"
          ? "Follow travellers to see their posts here. Try the Discover tab!"
          : "No posts yet. Be the first to share a journey!"}
      </div>
    );
  }
  return (
    <>
      {items.map((post) => (
        <PostCard key={post._id} post={post} onChange={replace} onDeleted={remove} />
      ))}
      {error && <div className="sg-state">{error}</div>}
      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
}

const FeedPage = () => {
  const [tab, setTab] = useState(null); // null until we know where to start
  const [showCreate, setShowCreate] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Open on "Following" only if it has something to show; otherwise on Discover.
  useEffect(() => {
    let alive = true;
    getFeed("following")
      .then((r) => alive && setTab(r.data.length ? "following" : "discover"))
      .catch(() => alive && setTab("discover"));
    return () => {
      alive = false;
    };
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    setTab("discover"); // your new post shows up in Discover
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="sg-page">
      <div className="sg-column">
        <div className="sg-header">
          <Wordmark />
          <button className="sg-btn" onClick={() => setShowCreate(true)}>
            <Camera size={16} style={{ verticalAlign: "-3px" }} /> Share your journey
          </button>
        </div>

        <div className="sg-tabs">
          <button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}>
            Discover
          </button>
          <button className={tab === "following" ? "active" : ""} onClick={() => setTab("following")}>
            Following
          </button>
        </div>

        {tab ? <FeedList key={`${tab}-${reloadKey}`} tab={tab} /> : <div className="sg-state">Loading…</div>}
      </div>

      {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default FeedPage;
