import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Minus, Plus, Trash2, X } from "lucide-react";
import { MAX_ACTIVITIES } from "../utils/tripPlan";
import "../itinerary.scss";

// One stop of the trip: where, how many days, notes and activities. Reordering uses buttons
// (they work with a finger as well as a mouse).
const StopCard = ({ stop, index, count, onChange, onMove, onRemove, onDays, onAddActivity, onRemoveActivity }) => {
  const [activity, setActivity] = useState("");

  const add = () => {
    onAddActivity(activity);
    setActivity("");
  };

  return (
    <li className="it-stop">
      <div className="it-stop-head">
        <span className="it-stop-num">{index + 1}</span>
        {stop.destination.image ? <img src={stop.destination.image} alt="" loading="lazy" /> : <span className="it-stop-noimg" aria-hidden="true" />}
        <div className="it-stop-title">
          <Link to={`/destinations/${stop.destination._id}`}>{stop.destination.name}</Link>
          {stop.destination.address && <small>{stop.destination.address}</small>}
        </div>
        <div className="it-stop-tools">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${stop.destination.name} up`}><ArrowUp size={16} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label={`Move ${stop.destination.name} down`}><ArrowDown size={16} /></button>
          <button type="button" className="danger" onClick={onRemove} aria-label={`Remove ${stop.destination.name}`}><Trash2 size={16} /></button>
        </div>
      </div>

      <div className="it-stop-body">
        <div className="it-field inline">
          <span>Days here</span>
          <div className="it-stepper small">
            <button type="button" onClick={() => onDays(stop.days - 1)} disabled={stop.days <= 1} aria-label="One day fewer"><Minus size={14} /></button>
            <output aria-live="polite">{stop.days}</output>
            <button type="button" onClick={() => onDays(stop.days + 1)} aria-label="One day more"><Plus size={14} /></button>
          </div>
        </div>

        <div className="it-activities">
          {stop.activities.map((a) => (
            <span key={a} className="it-tag">
              {a}
              <button type="button" onClick={() => onRemoveActivity(a)} aria-label={`Remove ${a}`}><X size={12} /></button>
            </span>
          ))}
          {stop.activities.length < MAX_ACTIVITIES && (
            <span className="it-add-activity">
              <input
                value={activity}
                maxLength={60}
                placeholder="Add an activity"
                aria-label={`Add an activity at ${stop.destination.name}`}
                onChange={(e) => setActivity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
              />
              <button type="button" onClick={add} disabled={!activity.trim()} aria-label="Add activity"><Plus size={14} /></button>
            </span>
          )}
        </div>

        <textarea
          rows={2}
          maxLength={500}
          value={stop.notes}
          placeholder="Notes for this stop (optional)"
          aria-label={`Notes for ${stop.destination.name}`}
          onChange={(e) => onChange({ notes: e.target.value })}
        />
      </div>
    </li>
  );
};

export default StopCard;
