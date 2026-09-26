import React, { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getMessages } from "../api";
import { starText } from "../utils/adminFormat";
import { timeAgo } from "../../safargram/utils/timeAgo";

const AdminMessages = () => {
  const [type, setType] = useState("contact");
  const { items, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getMessages({ type, cursor }),
    [type],
  );

  return (
    <AdminLayout title="Messages">
      <div className="ad-subtabs" role="tablist">
        <button role="tab" className={type === "contact" ? "active" : ""} onClick={() => setType("contact")}>Contact form</button>
        <button role="tab" className={type === "feedback" ? "active" : ""} onClick={() => setType("feedback")}>Feedback</button>
      </div>

      {loading && <p className="ad-state">Loading…</p>}
      {error && <p className="ad-state">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="ad-state">No messages yet.</p>}

      {items.map((m) => (
        <article key={m._id} className="ad-message">
          <header>
            {type === "contact" ? (
              <span><strong>{m.name}</strong> · <a href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <> · {m.phone}</>}</span>
            ) : (
              <span className="ad-stars" aria-label={`Rating ${m.rating ?? "none"} out of 5`}>{starText(m.rating) || "No rating"}</span>
            )}
            <small>{timeAgo(m.createdAt)}</small>
          </header>
          <p>{m.message}</p>
        </article>
      ))}
      {hasMore && (
        <div className="ad-more">
          <button type="button" className="ad-btn ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more"}</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages;
