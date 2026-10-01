import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";
import { deleteItineraryAdmin, getAllItinerariesAdmin, setItineraryTemplate } from "../../itinerary/api";
import { timeAgo } from "../../safargram/utils/timeAgo";

// Curated templates show up on the public "Plan your yatra" page as public itineraries; everyone
// else's trips stay private. This screen lets an admin promote a good trip to a template, or
// demote/delete one.
const AdminItineraries = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all | templates | private
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    getAllItinerariesAdmin()
      .then((r) => setItems(r.data))
      .catch(() => setError("Could not load itineraries."));
  };
  useEffect(load, []);

  const toggleTemplate = async (trip) => {
    setBusyId(trip._id);
    try {
      const res = await setItineraryTemplate(trip._id, !trip.isTemplate);
      setItems((list) => list.map((i) => (i._id === trip._id ? res.data : i)));
      toast.success(res.data.isTemplate ? "Made a public template" : "Made private again");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update this itinerary");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (trip) => {
    if (!window.confirm(`Delete "${trip.title}"?`)) return;
    setBusyId(trip._id);
    try {
      await deleteItineraryAdmin(trip._id);
      setItems((list) => list.filter((i) => i._id !== trip._id));
      toast.success("Itinerary deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete this itinerary");
    } finally {
      setBusyId(null);
    }
  };

  const shown = (items || []).filter((i) => filter === "all" || (filter === "templates" ? i.isTemplate : !i.isTemplate));

  return (
    <AdminLayout title="Itineraries">
      <div className="ad-subtabs" role="tablist">
        {[["all", "All"], ["templates", "Public templates"], ["private", "Private trips"]].map(([id, label]) => (
          <button key={id} role="tab" className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>
        ))}
      </div>

      {error && <p className="ad-state">{error}</p>}
      {!items && !error && <p className="ad-state">Loading…</p>}
      {items && shown.length === 0 && <p className="ad-state">Nothing here.</p>}

      {shown.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Trip</th><th>Creator</th><th>Stops</th><th>Saved</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shown.map((trip) => (
                <tr key={trip._id}>
                  <td><strong>{trip.title}</strong>{trip.totalDuration && <div><small>{trip.totalDuration}</small></div>}</td>
                  <td>{trip.creator ? <Link to={`/profile/${trip.creator.username}`}>{trip.creator.username}</Link> : <em>deleted user</em>}</td>
                  <td>{trip.destinations.length}</td>
                  <td>{timeAgo(trip.createdAt)}</td>
                  <td><span className={`ad-pill ${trip.isTemplate ? "active" : ""}`}>{trip.isTemplate ? "Public template" : "Private"}</span></td>
                  <td className="ad-actions">
                    <button type="button" className="ad-link" disabled={busyId === trip._id} onClick={() => toggleTemplate(trip)}>
                      {trip.isTemplate ? "Make private" : "Make template"}
                    </button>
                    <button type="button" className="ad-link danger" disabled={busyId === trip._id} onClick={() => remove(trip)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminItineraries;
