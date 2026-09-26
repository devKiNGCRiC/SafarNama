import React, { useMemo } from "react";
import { AlertTriangle, MapPinned, RotateCcw } from "lucide-react";
import StopCard from "./StopCard";
import DestinationPicker from "./DestinationPicker";
import {
  MAX_STOPS, addActivity, buildDayList, moveStop, newStop, removeActivity, removeStop, setStopDays,
  suggestTitle, totalDays, updateStop,
} from "../utils/tripPlan";
import "../itinerary.scss";

// The trip being built: name, stops (reorder / days / activities / notes), a live day-by-day list,
// and Save. It never talks to the server itself: the page passes `onSave`.
const TripEditor = ({ title, setTitle, stops, setStops, plan, editing, saving, onSave, onClear }) => {
  const days = useMemo(() => buildDayList(stops), [stops]);
  const taken = useMemo(() => stops.map((s) => s.destination._id), [stops]);
  const summary = plan?.summary;

  return (
    <section className="it-card it-editor" aria-label="Your trip">
      <div className="it-editor-head">
        <h2><MapPinned size={20} /> {editing ? "Editing your trip" : "Your trip"}</h2>
        <button type="button" className="it-link" onClick={onClear}><RotateCcw size={14} /> Start over</button>
      </div>

      {plan?.warnings?.length > 0 && (
        <ul className="it-warnings" aria-label="Things to know">
          {plan.warnings.map((w) => <li key={w}><AlertTriangle size={15} /> {w}</li>)}
        </ul>
      )}

      <div className="it-summary" aria-live="polite">
        <span><b>{totalDays(stops)}</b> {totalDays(stops) === 1 ? "day" : "days"}</span>
        <span><b>{stops.length}</b> {stops.length === 1 ? "stop" : "stops"}</span>
        {summary?.totalKm > 0 && <span>about <b>{summary.totalKm}</b> km between stops</span>}
      </div>

      <div className="it-field">
        <label htmlFor="it-title">Trip name</label>
        <div className="it-title-row">
          <input id="it-title" type="text" value={title} maxLength={100} placeholder="e.g. Hills in June" onChange={(e) => setTitle(e.target.value)} />
          {!title.trim() && stops.length > 0 && (
            <button type="button" className="it-link" onClick={() => setTitle(suggestTitle(stops))}>Suggest a name</button>
          )}
        </div>
      </div>

      {stops.length === 0 ? (
        <p className="it-empty">No stops yet. Use “Plan my trip” above, or add a destination below.</p>
      ) : (
        <ol className="it-stops">
          {stops.map((stop, i) => (
            <StopCard
              key={stop.key}
              stop={stop}
              index={i}
              count={stops.length}
              onChange={(changes) => setStops((list) => updateStop(list, i, changes))}
              onMove={(delta) => setStops((list) => moveStop(list, i, delta))}
              onRemove={() => setStops((list) => removeStop(list, i))}
              onDays={(n) => setStops((list) => setStopDays(list, i, n))}
              onAddActivity={(name) => setStops((list) => addActivity(list, i, name))}
              onRemoveActivity={(name) => setStops((list) => removeActivity(list, i, name))}
            />
          ))}
        </ol>
      )}

      <DestinationPicker
        takenIds={taken}
        disabled={stops.length >= MAX_STOPS}
        onPick={(destination) => setStops((list) => (list.length >= MAX_STOPS ? list : [...list, newStop(destination)]))}
      />

      {days.length > 0 && (
        <div className="it-days">
          <h3>Day by day</h3>
          <ol>
            {days.map((d) => (
              <li key={d.day}>
                <b>Day {d.day}</b>
                <span>
                  <strong>{d.title}</strong>
                  <small>{d.activities.join(" · ")}</small>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <button type="button" className="it-btn primary big" onClick={onSave} disabled={saving || stops.length === 0}>
        {saving ? "Saving…" : editing ? "Save changes" : "Save itinerary"}
      </button>
    </section>
  );
};

export default TripEditor;
