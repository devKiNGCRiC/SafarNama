import React, { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { getDestinations } from "../api";

const DestinationPicker = ({ value, onChange }) => {
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    getDestinations()
      .then((list) => alive && setAll(list))
      .catch(() => {}); // the picker is optional; posting still works without it
    return () => {
      alive = false;
    };
  }, []);

  if (value) {
    return (
      <span className="sg-chip">
        <MapPin size={14} /> {value.name}
        <button type="button" aria-label="Remove destination" onClick={() => onChange(null)}>
          <X size={14} />
        </button>
      </span>
    );
  }

  const q = query.trim().toLowerCase();
  const matches = q ? all.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <div>
      <input
        type="text"
        placeholder="Search a destination (optional)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {matches.length > 0 && (
        <div className="sg-options">
          {matches.map((d) => (
            <button
              type="button"
              key={d._id}
              onClick={() => {
                onChange({ _id: d._id, name: d.name });
                setQuery("");
              }}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DestinationPicker;
