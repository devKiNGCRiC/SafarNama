import React, { useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { MONTHS } from "../utils/tripPlan";
import "../itinerary.scss";

const INTERESTS = ["Trekking", "Wildlife", "Beaches", "Water sports", "Camping", "Photography", "Culture", "Relaxation"];
const PACES = [
  { id: "relaxed", label: "Relaxed", hint: "About 3 days per place" },
  { id: "balanced", label: "Balanced", hint: "About 2 days per place" },
  { id: "packed", label: "Packed", hint: "A new place each day" },
];

// "Plan my trip": a few choices in, a full plan out (built by the server's planner).
const PlanForm = ({ onGenerate, busy }) => {
  const [form, setForm] = useState({ days: 5, month: "", pace: "balanced", interests: [], region: "" });

  const setDays = (n) => setForm((f) => ({ ...f, days: Math.min(14, Math.max(1, n)) }));
  const toggleInterest = (name) =>
    setForm((f) => ({ ...f, interests: f.interests.includes(name) ? f.interests.filter((i) => i !== name) : [...f.interests, name] }));

  const submit = (e) => {
    e.preventDefault();
    if (!busy) onGenerate(form);
  };

  return (
    <form className="it-card it-plan" onSubmit={submit}>
      <h2><Sparkles size={20} /> Plan my trip</h2>
      <p className="it-sub">Tell us what you like and we will suggest a route from our destinations. You can change anything afterwards.</p>

      <div className="it-field">
        <label htmlFor="it-days">How many days?</label>
        <div className="it-stepper">
          <button type="button" onClick={() => setDays(form.days - 1)} disabled={form.days <= 1} aria-label="One day fewer"><Minus size={16} /></button>
          <input id="it-days" type="number" min={1} max={14} value={form.days} onChange={(e) => setDays(Math.round(Number(e.target.value)) || 1)} />
          <button type="button" onClick={() => setDays(form.days + 1)} disabled={form.days >= 14} aria-label="One day more"><Plus size={16} /></button>
        </div>
      </div>

      <div className="it-field">
        <label htmlFor="it-month">When are you travelling?</label>
        <select id="it-month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })}>
          <option value="">Not sure yet</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </div>

      <fieldset className="it-field">
        <legend>Your pace</legend>
        <div className="it-segments">
          {PACES.map((p) => (
            <label key={p.id} className={form.pace === p.id ? "on" : ""}>
              <input type="radio" name="pace" value={p.id} checked={form.pace === p.id} onChange={() => setForm({ ...form, pace: p.id })} />
              <b>{p.label}</b>
              <small>{p.hint}</small>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="it-field">
        <legend>What do you love? <small>(pick any)</small></legend>
        <div className="it-chips">
          {INTERESTS.map((name) => (
            <button key={name} type="button" className={form.interests.includes(name) ? "on" : ""} aria-pressed={form.interests.includes(name)} onClick={() => toggleInterest(name)}>
              {name}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="it-field">
        <label htmlFor="it-region">Any state or region? <small>(optional)</small></label>
        <input id="it-region" type="text" maxLength={60} placeholder="e.g. Uttarakhand, Kerala" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
      </div>

      <button className="it-btn primary big" disabled={busy}>{busy ? "Planning…" : "Generate itinerary"}</button>
    </form>
  );
};

export default PlanForm;
