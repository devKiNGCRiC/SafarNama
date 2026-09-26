import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getGuides } from "../api";
import GuideCard from "../components/GuideCard";
import { CATEGORY_LABELS } from "../utils/guideFormat";
import "../../events/events.scss";
import "../guides.scss";

const CATEGORIES = ["ALL", ...Object.keys(CATEGORY_LABELS)];

const GuidesPage = () => {
  const user = useSelector((state) => state.auth.user);
  const [params, setParams] = useSearchParams();
  const tag = params.get("tag") || "";
  const [category, setCategory] = useState("ALL");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  // wait a moment after typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { items, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getGuides({ category, search, tag, cursor }),
    [category, search, tag],
  );

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <div className="ev-head">
          <div>
            <h1>Eco-Tourism Guides</h1>
            <p>Discover sustainable travel tips and local insights</p>
          </div>
          {user?.role === "admin" && <Link to="/admin/eco-guides" className="ev-btn ghost">Manage guides</Link>}
        </div>

        <div className="ev-filters">
          <input className="ev-search" type="search" placeholder="Search guides…" value={input} onChange={(e) => setInput(e.target.value)} />
          <div className="ev-chips">
            {CATEGORIES.map((c) => (
              <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
                {c === "ALL" ? "All guides" : CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {tag && (
          <p>
            Showing guides tagged <strong>#{tag}</strong>{" "}
            <button type="button" className="ev-link" onClick={() => setParams({})}>Clear</button>
          </p>
        )}

        {loading && <div className="ev-state">Loading guides…</div>}
        {error && <div className="ev-state">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="ev-state">
            {search || tag || category !== "ALL" ? "No guides match your search." : "No guides have been published yet. Check back soon!"}
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="gd-grid">
              {items.map((guide) => <GuideCard key={guide._id} guide={guide} />)}
            </div>
            {hasMore && (
              <div className="gd-more">
                <button type="button" className="ev-btn ghost" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuidesPage;
