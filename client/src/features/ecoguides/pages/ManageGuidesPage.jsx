import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteGuide, getGuide, getGuides } from "../api";
import GuideForm from "../components/GuideForm";
import { categoryLabel, formatDay } from "../utils/guideFormat";
import "../../events/events.scss";
import "../guides.scss";

// Admin screen: every guide, with create / edit / delete.
const ManageGuidesPage = () => {
  const [guides, setGuides] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null | "new" | guide (full article, loaded on demand)

  const load = useCallback(async (after = null) => {
    try {
      const page = await getGuides({ cursor: after });
      setGuides((list) => (after ? [...(list || []), ...page.data] : page.data));
      setCursor(page.nextCursor);
      setError("");
    } catch {
      setError("Could not load guides.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // the list only has teasers, so fetch the whole article before editing
  const edit = async (guide) => {
    try {
      const res = await getGuide(guide._id);
      setForm(res.data);
    } catch {
      toast.error("Could not open the guide for editing");
    }
  };

  const remove = async (guide) => {
    if (!window.confirm(`Delete "${guide.title}"? Its likes and comments will be lost.`)) return;
    try {
      await deleteGuide(guide._id);
      setGuides((list) => list.filter((g) => g._id !== guide._id));
      toast.success("Guide deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete the guide");
    }
  };

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <div className="ev-head">
          <div>
            <h1>Manage guides</h1>
            <p><Link to="/eco-guides">View the public guides page</Link></p>
          </div>
          <button type="button" className="ev-btn" onClick={() => setForm("new")}>+ New guide</button>
        </div>

        {error && <div className="ev-state">{error}</div>}
        {!guides && !error && <div className="ev-state">Loading…</div>}
        {guides && guides.length === 0 && <div className="ev-state">No guides yet. Write the first one!</div>}

        {guides && guides.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="ev-admin-table">
              <thead><tr><th>Guide</th><th>Published</th><th>Likes</th><th>Comments</th><th>Actions</th></tr></thead>
              <tbody>
                {guides.map((g) => (
                  <tr key={g._id}>
                    <td>
                      <Link to={`/eco-guides/${g._id}`}><strong>{g.title}</strong></Link>
                      <div><small>{categoryLabel(g.category)}</small></div>
                    </td>
                    <td>{formatDay(g.createdAt)}</td>
                    <td>{g.likeCount}</td>
                    <td>{g.commentCount}</td>
                    <td>
                      <button type="button" className="ev-link" onClick={() => edit(g)}>Edit</button>
                      <button type="button" className="ev-link" style={{ color: "#e63946" }} onClick={() => remove(g)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cursor && (
              <div className="gd-more">
                <button type="button" className="ev-btn ghost" onClick={() => load(cursor)}>Load more</button>
              </div>
            )}
          </div>
        )}
      </div>

      {form && (
        <GuideForm
          guide={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}
    </div>
  );
};

export default ManageGuidesPage;
