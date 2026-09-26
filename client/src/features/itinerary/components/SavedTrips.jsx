import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { deleteItinerary, getMyItineraries } from "../api";
import "../itinerary.scss";

// "Your saved itineraries" for logged-in people. `reloadKey` changes after each save.
const SavedTrips = ({ reloadKey, onEdit }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = me?.id || me?._id;
  const [items, setItems] = useState(null); // null = loading

  useEffect(() => {
    if (!myId) return undefined;
    let alive = true;
    getMyItineraries(myId)
      .then((r) => alive && setItems(r.data)) // the server sends the newest first
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [myId, reloadKey]);

  const remove = async (trip) => {
    if (!window.confirm(`Delete "${trip.title}"?`)) return;
    try {
      await deleteItinerary(trip._id);
      setItems((list) => list.filter((i) => i._id !== trip._id));
      toast.success("Itinerary deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete the itinerary");
    }
  };

  if (!myId || items === null) return null;

  return (
    <section className="it-saved" aria-label="Your saved itineraries">
      <h2>Your saved itineraries</h2>
      {items.length === 0 ? (
        <p className="it-sub">Nothing saved yet. Plan or build a trip above and press save. It will be kept here.</p>
      ) : (
        <div className="it-saved-grid">
          {items.map((trip) => (
            <article key={trip._id} className="it-card it-saved-card">
              <header>
                <h3>{trip.title}</h3>
                {trip.generated && <span className="it-badge">Planned for you</span>}
              </header>
              <p className="it-sub">
                {trip.totalDuration ? `${trip.totalDuration} · ` : ""}
                {trip.destinations.length} {trip.destinations.length === 1 ? "stop" : "stops"}
                {trip.createdAt ? ` · saved ${new Date(trip.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
              </p>
              <ol>
                {trip.destinations.map((stop, i) => (
                  <li key={stop._id || i}>
                    {stop.destination ? <Link to={`/destinations/${stop.destination._id}`}>{stop.destination.name}</Link> : <span className="gone">(destination no longer available)</span>}
                    {stop.duration ? <small> · {stop.duration}</small> : null}
                  </li>
                ))}
              </ol>
              <footer>
                <button type="button" className="it-btn small" onClick={() => onEdit(trip)}>Edit</button>
                <button type="button" className="it-btn small ghost danger" onClick={() => remove(trip)}>Delete</button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedTrips;
