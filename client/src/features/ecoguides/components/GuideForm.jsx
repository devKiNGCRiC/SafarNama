import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createGuide, updateGuide } from "../api";
import { CATEGORY_LABELS, tagsToInput } from "../utils/guideFormat";
import "../../events/events.scss";
import "../guides.scss";

const CATEGORIES = Object.keys(CATEGORY_LABELS);

// Create (no `guide`) or edit (with `guide`) - used by admins.
const GuideForm = ({ guide, onClose, onSaved }) => {
  const editing = Boolean(guide);
  const [form, setForm] = useState({
    title: guide?.title || "",
    category: guide?.category || "SUSTAINABLE_TIPS",
    summary: guide?.summary || "",
    content: guide?.content || "",
    tags: tagsToInput(guide?.tags),
  });
  const [cover, setCover] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : guide?.cover || ""), [cover, guide]);
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
    const body = new FormData();
    for (const [key, value] of Object.entries(form)) body.append(key, value);
    if (cover) body.append("image", cover);

    setBusy(true);
    setError("");
    try {
      const res = editing ? await updateGuide(guide._id, body) : await createGuide(body);
      toast.success(editing ? "Guide updated" : "Guide published");
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the guide. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="ev-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="ev-modal" onSubmit={submit}>
        <h2>{editing ? "Edit guide" : "New guide"}</h2>

        <label htmlFor="gd-title">Title</label>
        <input id="gd-title" value={form.title} onChange={set("title")} maxLength={120} required />

        <label htmlFor="gd-cat">Category</label>
        <select id="gd-cat" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>

        <label htmlFor="gd-summary">Short summary (optional, shown on the cards)</label>
        <input id="gd-summary" value={form.summary} onChange={set("summary")} maxLength={200} />

        <label htmlFor="gd-content">Article (leave a blank line between paragraphs)</label>
        <textarea id="gd-content" rows={10} value={form.content} onChange={set("content")} maxLength={20000} required />

        <label htmlFor="gd-tags">Tags (separated by commas, up to 8)</label>
        <input id="gd-tags" value={form.tags} onChange={set("tags")} placeholder="plastic-free, packing" />

        <label htmlFor="gd-cover">Cover photo (optional, JPG/PNG/WEBP up to 8 MB)</label>
        <input id="gd-cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} />
        {preview && <img className="ev-cover-preview" src={preview} alt="Cover preview" />}

        {error && <div className="ev-error">{error}</div>}
        <div className="ev-modal-actions">
          <button type="button" className="ev-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="ev-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Publish"}</button>
        </div>
      </form>
    </div>
  );
};

export default GuideForm;
