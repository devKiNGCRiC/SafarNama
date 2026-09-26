import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { http } from "../../config/api";
import "./SavedItineraries.css";

// "Your saved itineraries" - shown under the builder for logged-in users.
// `reloadKey` changes after each save so the new one appears without a page refresh.
const SavedItineraries = ({ reloadKey }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = me?.id || me?._id;
  const [items, setItems] = useState(null); // null = loading

  useEffect(() => {
    if (!myId) return undefined;
    let alive = true;
    http
      .get(`/api/v1/itineraries/user/${myId}`)
      .then((r) => alive && setItems([...r.data.data].reverse())) // newest first
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [myId, reloadKey]);

  const remove = async (id) => {
    if (!window.confirm("Delete this itinerary?")) return;
    try {
      await http.delete(`/api/v1/itineraries/${id}`);
      setItems((list) => list.filter((i) => i._id !== id));
      toast.success("Itinerary deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete the itinerary");
    }
  };

  if (!myId || items === null) return null;

  return (
    <section className="saved-itineraries">
      <h2>Your saved itineraries</h2>
      {items.length === 0 ? (
        <p className="saved-itineraries-empty">
          Nothing saved yet. Build a trip above and press save - it will be kept here.
        </p>
      ) : (
        <div className="saved-itineraries-grid">
          {items.map((it) => (
            <article key={it._id} className="saved-itinerary-card">
              <header>
                <h3>{it.title}</h3>
                <button type="button" onClick={() => remove(it._id)} aria-label={`Delete ${it.title}`}>
                  Delete
                </button>
              </header>
              <p className="meta">
                {it.totalDuration ? `${it.totalDuration} · ` : ""}
                {it.destinations.length} {it.destinations.length === 1 ? "stop" : "stops"}
                {it.createdAt ? ` · saved ${new Date(it.createdAt).toLocaleDateString()}` : ""}
              </p>
              <ol>
                {it.destinations.map((stop, i) => (
                  <li key={stop._id || i}>
                    {stop.destination ? (
                      <Link to={`/destinations/${stop.destination._id}`}>{stop.destination.name}</Link>
                    ) : (
                      <span className="gone">(destination no longer available)</span>
                    )}
                    {stop.duration ? <small> · {stop.duration}</small> : null}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default SavedItineraries;
