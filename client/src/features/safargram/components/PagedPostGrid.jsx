import React from "react";
import useCursorList from "../hooks/useCursorList";
import PostGrid from "./PostGrid";
import "../safargram.scss";

const PagedPostGrid = ({ fetchPage, deps, emptyText }) => {
  const { items, loading, loadingMore, error, hasMore, loadMore, reload } = useCursorList(fetchPage, deps);

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
  return (
    <>
      <PostGrid posts={items} loading={loading} emptyText={emptyText} />
      {hasMore && (
        <div className="sg-state">
          <button className="sg-btn ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </>
  );
};

export default PagedPostGrid;
