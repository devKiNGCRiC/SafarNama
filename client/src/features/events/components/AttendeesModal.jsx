import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getEventAttendees } from "../api";
import "../events.scss";

// Who registered (organizer / admin only - the server refuses everyone else).
const AttendeesModal = ({ event, onClose }) => {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getEventAttendees(event._id)
      .then((r) => alive && setPeople(r.data))
      .catch((e) => alive && setError(e.response?.data?.message || "Could not load the attendee list"));
    return () => {
      alive = false;
    };
  }, [event._id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ev-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ev-modal">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Attendees · {event.title}</h2>
          <button type="button" className="ev-link" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>
        {error && <div className="ev-error">{error}</div>}
        {!people && !error && <p>Loading…</p>}
        {people && people.length === 0 && <p>Nobody has registered yet.</p>}
        {people && people.length > 0 && (
          <table className="ev-admin-table">
            <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Registered</th></tr></thead>
            <tbody>
              {people.map((p) => (
                <tr key={p._id}>
                  <td>{p.name || "—"}</td>
                  <td>@{p.username}</td>
                  <td>{p.email}</td>
                  <td>{new Date(p.registeredAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendeesModal;
