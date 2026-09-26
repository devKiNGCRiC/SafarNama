import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { getDestinations } from "../api";
import "../itinerary.scss";

// "Add a destination": search all destinations and add one as a new stop.
const DestinationPicker = ({ takenIds, disabled, onPick }) => {
  const [all, setAll] = useState(null); // null = loading
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    getDestinations()
      .then((r) => alive && setAll(r.data || []))
      .catch(() => alive && setError("Could not load the destinations."));
    return () => {
      alive = false;
    };
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (all || [])
      .filter((d) => !takenIds.includes(d._id) && (!q || d.name.toLowerCase().includes(q) || (d.address || "").toLowerCase().includes(q)))
      .slice(0, 8);
  }, [all, query, takenIds]);

  return (
    <div className="it-picker">
      <label htmlFor="it-picker-search"><Search size={16} /> Add a destination</label>
      <input id="it-picker-search" type="search" placeholder="Search by name or place…" value={query} onChange={(e) => setQuery(e.target.value)} disabled={disabled} />
      {error && <p className="it-error">{error}</p>}
      {all === null && !error && <p className="it-sub">Loading destinations…</p>}
      {all && matches.length === 0 && <p className="it-sub">{query ? "No destination matches." : "You have added every destination."}</p>}
      <ul>
        {matches.map((d) => (
          <li key={d._id}>
            {d.images?.[0] ? <img src={d.images[0]} alt="" loading="lazy" /> : <span className="it-stop-noimg" aria-hidden="true" />}
            <span><b>{d.name}</b><small>{d.address}</small></span>
            <button type="button" className="it-btn small" disabled={disabled} onClick={() => onPick(d)} aria-label={`Add ${d.name}`}><Plus size={14} /> Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DestinationPicker;
