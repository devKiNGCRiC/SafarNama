import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getThreads } from "../api";
import ThreadCard from "../components/ThreadCard";
import ThreadForm from "../components/ThreadForm";
import useRequireLogin from "../hooks/useRequireLogin";
import { CATEGORY_LABELS } from "../utils/forumFormat";
import "../forum.scss";

const CATEGORIES = ["ALL", ...Object.keys(CATEGORY_LABELS)];

const ForumPage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const requireLogin = useRequireLogin();
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag") || "";

  const [tab, setTab] = useState("all"); // all | saved | mine
  const [category, setCategory] = useState("ALL");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);

  // wait a moment after typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { items, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getThreads({ category, tag, search, saved: tab === "saved", mine: tab === "mine", cursor }),
    [category, tag, search, tab],
  );

  const startThread = () => {
    if (requireLogin("start a discussion")) setComposing(true);
  };

  const emptyText =
    tab === "saved" ? "You have not saved any threads yet."
    : tab === "mine" ? "You have not started any threads yet."
    : search || tag || category !== "ALL" ? "No discussions match your search."
    : "No discussions yet. Start the first one!";

  return (
    <div className="fm-page">
      <div className="fm-wrap">
        <div className="fm-head">
          <div>
            <h1>Community Forum</h1>
            <p>Ask, share and plan together with fellow eco-travellers</p>
          </div>
          <button type="button" className="fm-btn" onClick={startThread}>+ New thread</button>
        </div>

        <div className="fm-tabs" role="tablist">
          <button role="tab" className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>All threads</button>
          {isAuthenticated && <button role="tab" className={tab === "saved" ? "active" : ""} onClick={() => setTab("saved")}>Saved</button>}
          {isAuthenticated && <button role="tab" className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>My threads</button>}
        </div>

        <div className="fm-filters">
          <input className="fm-search" type="search" placeholder="Search discussions…" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="fm-chips">
            {CATEGORIES.map((c) => (
              <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
                {c === "ALL" ? "All" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {tag && (
          <p>Showing threads tagged <strong>#{tag}</strong>{" "}
            <button type="button" className="fm-link" onClick={() => setParams({})}>Clear</button>
          </p>
        )}

        {loading && <div className="fm-state">Loading discussions…</div>}
        {error && <div className="fm-state">{error}</div>}
        {!loading && !error && items.length === 0 && <div className="fm-state">{emptyText}</div>}

        {!loading && items.length > 0 && (
          <>
            <div className="fm-list">{items.map((t) => <ThreadCard key={t._id} thread={t} />)}</div>
            {hasMore && (
              <div className="fm-more">
                <button type="button" className="fm-btn ghost" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}

        <p className="fm-foot">Be kind and keep it about travel. <Link to="/contact-Us">Report a problem</Link></p>
      </div>

      {composing && (
        <ThreadForm
          defaultCategory={category}
          onClose={() => setComposing(false)}
          onSaved={(thread) => navigate(`/forum/${thread._id}`)}
        />
      )}
    </div>
  );
};

export default ForumPage;
