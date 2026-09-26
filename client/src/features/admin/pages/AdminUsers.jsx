import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getUsers, userAction } from "../api";
import { statusOf, userActionsFor } from "../utils/adminFormat";
import { timeAgo } from "../../safargram/utils/timeAgo";

const AdminUsers = () => {
  const me = useSelector((state) => state.auth.user);
  const meId = me?.id || me?._id;
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [busyId, setBusyId] = useState(null);

  // wait a moment after typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const { items, setItems, loading, loadingMore, error, hasMore, loadMore } = useCursorList(
    (cursor) => getUsers({ search, status, role, cursor }),
    [search, status, role],
  );

  const run = async (user, action) => {
    if (!window.confirm(action.confirm)) return;
    setBusyId(user._id);
    try {
      const res = await userAction(user._id, action.id);
      setItems((list) => list.map((u) => (u._id === user._id ? res.data : u)));
      toast.success("Done");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not do that");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title="Users">
      <div className="ad-filters">
        <input type="search" placeholder="Search name, username or email…" value={input} onChange={(e) => setInput(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">Any role</option>
          <option value="user">Members</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading && <p className="ad-state">Loading…</p>}
      {error && <p className="ad-state">{error}</p>}
      {!loading && !error && items.length === 0 && <p className="ad-state">No one matches.</p>}

      {items.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Person</th><th>Status</th><th>Joined</th><th>Last login</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((u) => {
                const st = statusOf(u);
                return (
                  <tr key={u._id}>
                    <td>
                      <Link to={`/profile/${u.username}`}><strong>{u.username}</strong></Link>
                      {u.role === "admin" && <span className="ad-pill admin">Admin</span>}
                      <div><small>{u.name} · {u.email}{u.isEmailVerified ? "" : " (not verified)"}</small></div>
                    </td>
                    <td><span className={`ad-pill ${st.id}`}>{st.label}</span></td>
                    <td>{timeAgo(u.createdAt)}</td>
                    <td>{u.lastLogin ? timeAgo(u.lastLogin) : "–"}</td>
                    <td className="ad-actions">
                      {userActionsFor(u, meId).map((a) => (
                        <button key={a.id} type="button" className={`ad-link ${a.danger ? "danger" : ""}`} disabled={busyId === u._id} onClick={() => run(u, a)}>
                          {a.label}
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {hasMore && (
        <div className="ad-more">
          <button type="button" className="ad-btn ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? "Loading…" : "Load more"}</button>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUsers;
