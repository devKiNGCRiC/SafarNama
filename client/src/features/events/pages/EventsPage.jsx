import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { getEvents, getMyEvents } from "../api";
import EventCard from "../components/EventCard";
import { TYPE_LABELS } from "../utils/eventFormat";
import "../events.scss";

const CATEGORIES = ["ALL", "FESTIVAL", "ACTIVITY", "WORKSHOP", "CLEANUP"];

const EMPTY = {
  upcoming: "No upcoming events right now. Check back soon!",
  past: "No past events.",
  mine: "You have not registered for any events yet.",
};

const EventsPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [tab, setTab] = useState("upcoming"); // upcoming | past | mine
  const [type, setType] = useState("ALL");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // wait a moment after typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    const request = tab === "mine" ? getMyEvents() : getEvents({ when: tab, type, search });
    request
      .then((r) => alive && setEvents(r.data))
      .catch(() => alive && setError("Could not load events. Please try again."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, type, search]);

  // a card changed (registered / cancelled): update it in place; drop it from "My events" if cancelled
  const replace = (updated) =>
    setEvents((list) =>
      tab === "mine" && !updated.registeredByMe
        ? list.filter((e) => e._id !== updated._id)
        : list.map((e) => (e._id === updated._id ? updated : e)),
    );

  const filtersApply = tab !== "mine";

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <div className="ev-head">
          <div>
            <h1>Eco-Tourism Events</h1>
            <p>Join us in making tourism sustainable and impactful</p>
          </div>
          {user?.role === "admin" && (
            <Link to="/admin/events" className="ev-btn ghost">Manage events</Link>
          )}
        </div>

        <div className="ev-tabs" role="tablist">
          <button role="tab" className={tab === "upcoming" ? "active" : ""} onClick={() => setTab("upcoming")}>Upcoming</button>
          <button role="tab" className={tab === "past" ? "active" : ""} onClick={() => setTab("past")}>Past</button>
          {isAuthenticated && (
            <button role="tab" className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")}>My events</button>
          )}
        </div>

        {filtersApply && (
          <div className="ev-filters">
            <input
              className="ev-search"
              type="search"
              placeholder="Search events…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="ev-chips">
              {CATEGORIES.map((c) => (
                <button key={c} className={type === c ? "active" : ""} onClick={() => setType(c)}>
                  {c === "ALL" ? "All" : TYPE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <div className="ev-state">Loading events…</div>}
        {error && <div className="ev-state">{error}</div>}
        {!loading && !error && events.length === 0 && (
          <div className="ev-state">{search || type !== "ALL" ? "No events match your search." : EMPTY[tab]}</div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="ev-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} onChange={replace} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
