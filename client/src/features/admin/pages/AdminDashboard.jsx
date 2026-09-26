import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { getAudit, getOverview } from "../api";
import { auditSentence } from "../utils/adminFormat";
import { timeAgo } from "../../safargram/utils/timeAgo";

const Stat = ({ label, value, to, alert }) => {
  const inner = (
    <>
      <b>{value ?? "–"}</b>
      <span>{label}</span>
    </>
  );
  return to ? <Link to={to} className={`ad-stat ${alert ? "alert" : ""}`}>{inner}</Link> : <div className="ad-stat">{inner}</div>;
};

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [audit, setAudit] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getOverview()
      .then((r) => alive && setData(r.data))
      .catch(() => alive && setError("Could not load the overview."));
    getAudit().then((r) => alive && setAudit(r.data)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const c = data?.counts;

  return (
    <AdminLayout title="Overview">
      {error && <p className="ad-state">{error}</p>}
      {!data && !error && <p className="ad-state">Loading…</p>}
      {data && (
        <>
          <div className="ad-attention">
            <Stat label="Open reports" value={c.openReports} to="/admin/reports" alert={c.openReports > 0} />
            <Stat label="Messages received" value={c.messages} to="/admin/messages" />
            <Stat label="Suspended accounts" value={c.suspendedUsers} to="/admin/users" />
          </div>

          <h3>People</h3>
          <div className="ad-stats">
            <Stat label="Members" value={c.users} to="/admin/users" />
            <Stat label="Joined this week" value={c.newUsersThisWeek} />
            <Stat label="Email verified" value={c.verifiedUsers} />
            <Stat label="Newsletter subscribers" value={c.subscribers} />
          </div>

          <h3>Content</h3>
          <div className="ad-stats">
            <Stat label="SafarGram posts" value={c.posts} />
            <Stat label="Blogs" value={c.blogs} />
            <Stat label="Eco-guides" value={c.guides} to="/admin/eco-guides" />
            <Stat label="Events" value={c.events} to="/admin/events" />
            <Stat label="Forum threads" value={c.forumThreads} />
            <Stat label="Gallery photos" value={c.galleryPhotos} />
            <Stat label="Destinations" value={c.destinations} to="/admin/destinations" />
            <Stat label="Tours" value={c.tours} />
          </div>

          <div className="ad-columns">
            <section className="ad-card">
              <h3>Newest members</h3>
              {data.recentUsers.length === 0 && <p className="ad-muted">No members yet.</p>}
              {data.recentUsers.map((u) => (
                <div key={u._id} className="ad-row">
                  <span><strong>{u.username}</strong><small>{u.email}</small></span>
                  <small>{timeAgo(u.createdAt)}</small>
                </div>
              ))}
            </section>
            <section className="ad-card">
              <h3>Recent admin actions</h3>
              {audit.length === 0 && <p className="ad-muted">Nothing yet.</p>}
              {audit.map((a) => (
                <div key={a._id} className="ad-row">
                  <span>{auditSentence(a)}</span>
                  <small>{timeAgo(a.createdAt)}</small>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
