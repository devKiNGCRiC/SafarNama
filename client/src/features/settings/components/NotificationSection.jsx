import React, { useState } from "react";
import toast from "react-hot-toast";
import { saveNotificationPrefs } from "../api";

const KINDS = [
  { key: "likes", label: "Likes", hint: "When someone likes your SafarGram post" },
  { key: "comments", label: "Comments", hint: "When someone comments on your post" },
  { key: "follows", label: "New followers", hint: "When someone starts following you" },
];

// Each switch saves at once; if the server says no, the switch goes back.
const NotificationSection = ({ prefs, onChange }) => {
  const [busy, setBusy] = useState(null);

  const toggle = async (key) => {
    if (busy) return;
    const next = !prefs[key];
    setBusy(key);
    onChange({ ...prefs, [key]: next });
    try {
      const res = await saveNotificationPrefs({ [key]: next });
      onChange(res.data.notifications);
    } catch (e) {
      onChange({ ...prefs, [key]: !next });
      toast.error(e.response?.data?.message || "Could not save that setting");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="st-card" id="notifications">
      <h2>Notifications</h2>
      <p className="st-sub">Choose what shows up in your bell and on the Notifications page. Chat messages have their own badge.</p>
      {KINDS.map(({ key, label, hint }) => (
        <label key={key} className="st-toggle">
          <span>
            <strong>{label}</strong>
            <small>{hint}</small>
          </span>
          <input type="checkbox" role="switch" checked={prefs[key]} disabled={busy === key} onChange={() => toggle(key)} />
        </label>
      ))}
    </section>
  );
};

export default NotificationSection;
