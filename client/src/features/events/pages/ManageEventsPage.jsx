import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { deleteEvent, getEvents } from "../api";
import EventForm from "../components/EventForm";
import AttendeesModal from "../components/AttendeesModal";
import { TYPE_LABELS, formatDateRange } from "../utils/eventFormat";
import "../events.scss";

// Admin screen: every event, with create / edit / delete and the attendee list.
const ManageEventsPage = () => {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // null | "new" | event
  const [attendeesOf, setAttendeesOf] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await getEvents({ when: "all" });
      setEvents(r.data);
      setError("");
    } catch {
      setError("Could not load events.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? ${event.registeredCount} registration(s) will be lost.`)) return;
    try {
      await deleteEvent(event._id);
      setEvents((list) => list.filter((e) => e._id !== event._id));
      toast.success("Event deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete the event");
    }
  };

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <div className="ev-head">
          <div>
            <h1>Manage events</h1>
            <p><Link to="/events">View the public events page</Link></p>
          </div>
          <button type="button" className="ev-btn" onClick={() => setForm("new")}>+ New event</button>
        </div>

        {error && <div className="ev-state">{error}</div>}
        {!events && !error && <div className="ev-state">Loading…</div>}
        {events && events.length === 0 && <div className="ev-state">No events yet. Create the first one!</div>}

        {events && events.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="ev-admin-table">
              <thead>
                <tr><th>Event</th><th>When</th><th>Registered</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e._id} className={e.isPast ? "past-row" : ""}>
                    <td>
                      <Link to={`/events/${e._id}`}><strong>{e.title}</strong></Link>
                      <div><small>{TYPE_LABELS[e.type]}{e.isPast ? " · ended" : ""}</small></div>
                    </td>
                    <td>{formatDateRange(e.startDate, e.endDate)}</td>
                    <td>{e.registeredCount}{e.capacity ? ` / ${e.capacity}` : ""}</td>
                    <td>
                      <button type="button" className="ev-link" onClick={() => setForm(e)}>Edit</button>
                      <button type="button" className="ev-link" onClick={() => setAttendeesOf(e)}>Attendees</button>
                      <button type="button" className="ev-link" style={{ color: "#e63946" }} onClick={() => remove(e)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form && (
        <EventForm
          event={form === "new" ? null : form}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            load();
          }}
        />
      )}
      {attendeesOf && <AttendeesModal event={attendeesOf} onClose={() => setAttendeesOf(null)} />}
    </div>
  );
};

export default ManageEventsPage;
