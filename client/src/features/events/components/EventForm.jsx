import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createEvent, updateEvent } from "../api";
import { TYPE_LABELS, fromInputValue, toInputValue } from "../utils/eventFormat";
import "../events.scss";

const TYPES = Object.keys(TYPE_LABELS);

// Create (no `event`) or edit (with `event`) - used by admins.
const EventForm = ({ event, onClose, onSaved }) => {
  const editing = Boolean(event);
  const [form, setForm] = useState({
    title: event?.title || "",
    type: event?.type || "ACTIVITY",
    description: event?.description || "",
    venue: event?.venue || "",
    startDate: event ? toInputValue(event.startDate) : "",
    endDate: event ? toInputValue(event.endDate) : "",
    capacity: event?.capacity ?? 30,
    impact: event?.impact || "",
  });
  const [cover, setCover] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : event?.images?.[0] || ""), [cover, event]);
  useEffect(() => () => cover && URL.revokeObjectURL(preview), [cover, preview]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const start = fromInputValue(form.startDate);
    const end = fromInputValue(form.endDate);
    if (!start || !end) return setError("Please choose the start and end date and time.");
    if (new Date(end) < new Date(start)) return setError("The event cannot end before it starts.");

    const body = new FormData();
    body.append("title", form.title);
    body.append("type", form.type);
    body.append("description", form.description);
    body.append("venue", form.venue);
    body.append("startDate", start);
    body.append("endDate", end);
    body.append("capacity", form.capacity);
    body.append("impact", form.impact);
    if (cover) body.append("image", cover);

    setBusy(true);
    setError("");
    try {
      const res = editing ? await updateEvent(event._id, body) : await createEvent(body);
      toast.success(editing ? "Event updated" : "Event created");
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the event. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="ev-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="ev-modal" onSubmit={submit}>
        <h2>{editing ? "Edit event" : "New event"}</h2>

        <label htmlFor="ev-title">Title</label>
        <input id="ev-title" value={form.title} onChange={set("title")} maxLength={120} required />

        <div className="ev-row">
          <div>
            <label htmlFor="ev-type">Type</label>
            <select id="ev-type" value={form.type} onChange={set("type")}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ev-capacity">Capacity (people)</label>
            <input id="ev-capacity" type="number" min={1} max={100000} value={form.capacity} onChange={set("capacity")} required />
          </div>
        </div>

        <div className="ev-row">
          <div>
            <label htmlFor="ev-start">Starts</label>
            <input id="ev-start" type="datetime-local" value={form.startDate} onChange={set("startDate")} required />
          </div>
          <div>
            <label htmlFor="ev-end">Ends</label>
            <input id="ev-end" type="datetime-local" value={form.endDate} onChange={set("endDate")} required />
          </div>
        </div>

        <label htmlFor="ev-venue">Venue</label>
        <input id="ev-venue" value={form.venue} onChange={set("venue")} maxLength={120} placeholder="e.g. Juhu Beach, Mumbai" />

        <label htmlFor="ev-desc">Description</label>
        <textarea id="ev-desc" rows={5} value={form.description} onChange={set("description")} maxLength={2000} required />

        <label htmlFor="ev-impact">Environmental impact (optional)</label>
        <input id="ev-impact" value={form.impact} onChange={set("impact")} maxLength={500} placeholder="e.g. Removes about 200 kg of plastic" />

        <label htmlFor="ev-cover">Cover photo (optional, JPG/PNG/WEBP up to 8 MB)</label>
        <input id="ev-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} />
        {preview && <img className="ev-cover-preview" src={preview} alt="Cover preview" />}

        {error && <div className="ev-error">{error}</div>}
        <div className="ev-modal-actions">
          <button type="button" className="ev-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="ev-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create event"}</button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;
