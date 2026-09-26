import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getReports, resolveReport } from "../api";
import { deleteThread, deleteReply } from "../../forum/api";
import { deletePhoto } from "../../gallery/api";
import { deletePost } from "../../safargram/api";
import { reasonLabel, typeLabel } from "../../reports/reportLabels";
import { timeAgo } from "../../safargram/utils/timeAgo";

// Removing the reported content uses the same delete calls the rest of the site uses
// (they already allow admins), so nothing is deleted in a special way here.
const REMOVERS = {
  FORUM_THREAD: deleteThread,
  FORUM_REPLY: deleteReply,
  GALLERY_PHOTO: deletePhoto,
  SAFARGRAM_POST: deletePost,
};

const TABS = [["open", "Open"], ["actioned", "Content removed"], ["dismissed", "Dismissed"]];

const AdminReports = () => {
  const [status, setStatus] = useState("open");
  const [busyId, setBusyId] = useState(null);
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getReports({ status, cursor }),
    [status],
  );

  // every report about the same content is handled together, so they all leave the list
  const drop = (report) =>
    setItems((list) => list.filter((r) => !(r.targetType === report.targetType && r.targetId === report.targetId)));

  const dismiss = async (report) => {
    setBusyId(report._id);
    try {
      await resolveReport(report._id, "dismissed");
      drop(report);
      toast.success("Report dismissed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not dismiss the report");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (report) => {
    if (!window.confirm(`Remove this ${typeLabel(report.targetType).toLowerCase()}? This cannot be undone.`)) return;
    setBusyId(report._id);
    try {
      try {
        await REMOVERS[report.targetType](report.targetId);
      } catch (e) {
        if (e.response?.status !== 404) throw e; // already gone is fine
      }
      await resolveReport(report._id, "actioned");
      drop(report);
      toast.success("Content removed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not remove the content");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Reports">
      <div className="ad-subtabs" role="tablist">
        {TABS.map(([id, label]) => (
          <button key={id} role="tab" className={status === id ? "active" : ""} onClick={() => setStatus(id)}>{label}</button>
        ))}
      </div>

      {loading && <p className="ad-state">Loading…</p>}
      {error && <p className="ad-state">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="ad-state">{status === "open" ? "Nothing to review. All clear!" : "Nothing here."}</p>
      )}

      {items.map((r) => (
        <article key={r._id} className="ad-report">
          <div className="ad-report-main">
            {r.snapshot?.image && <img src={r.snapshot.image} alt="" loading="lazy" />}
            <div>
              <div className="ad-report-top">
                <span className="ad-pill">{typeLabel(r.targetType)}</span>
                <span className="ad-pill reason">{reasonLabel(r.reason)}</span>
                {r.status === "open" && r.openForTarget > 1 && <span className="ad-pill alert">{r.openForTarget} reports</span>}
              </div>
              <p className="ad-report-text">{r.snapshot?.text || "(no text)"}</p>
              {r.details && <p className="ad-muted">“{r.details}”</p>}
              <small className="ad-muted">
                Reported by <strong>{r.reporter?.username || "deleted user"}</strong> {timeAgo(r.createdAt)}
                {r.targetOwner && <> · posted by <strong>{r.targetOwner.username}</strong></>}
              </small>
            </div>
          </div>
          <div className="ad-report-actions">
            {r.link && <Link to={r.link} className="ad-btn ghost" target="_blank" rel="noopener noreferrer">View</Link>}
            {r.status === "open" && (
              <>
                <button type="button" className="ad-btn ghost" disabled={busyId === r._id} onClick={() => dismiss(r)}>Dismiss</button>
                <button type="button" className="ad-btn danger" disabled={busyId === r._id} onClick={() => remove(r)}>Remove content</button>
              </>
            )}
          </div>
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

export default AdminReports;
