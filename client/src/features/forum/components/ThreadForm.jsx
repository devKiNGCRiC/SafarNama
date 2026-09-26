import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { createThread, updateThread } from "../api";
import { CATEGORY_HINTS, CATEGORY_LABELS, tagsToInput, threadFormError } from "../utils/forumFormat";
import "../forum.scss";

const CATEGORIES = Object.keys(CATEGORY_LABELS);

// Start a thread (no `thread`) or edit one (with `thread`, which must carry the full text).
const ThreadForm = ({ thread, defaultCategory, onClose, onSaved }) => {
  const editing = Boolean(thread);
  const [form, setForm] = useState({
    title: thread?.title || "",
    category: thread?.category || (CATEGORIES.includes(defaultCategory) ? defaultCategory : "GENERAL"),
    content: thread?.content || "",
    tags: tagsToInput(thread?.tags),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const problem = threadFormError(form);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const res = editing ? await updateThread(thread._id, form) : await createThread(form);
      toast.success(editing ? "Thread updated" : "Thread posted");
      onSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the thread. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="fm-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="fm-modal" onSubmit={submit}>
        <h2>{editing ? "Edit thread" : "Start a discussion"}</h2>

        <label htmlFor="fm-cat">Category</label>
        <select id="fm-cat" value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <small>{CATEGORY_HINTS[form.category]}</small>

        <label htmlFor="fm-title">Title</label>
        <input id="fm-title" value={form.title} onChange={set("title")} maxLength={140} placeholder="What would you like to discuss?" autoFocus />

        <label htmlFor="fm-content">Details</label>
        <textarea id="fm-content" rows={8} value={form.content} onChange={set("content")} maxLength={5000} />

        <label htmlFor="fm-tags">Tags (separated by commas, up to 5)</label>
        <input id="fm-tags" value={form.tags} onChange={set("tags")} placeholder="coorg, monsoon" />

        {error && <p className="fm-error" role="alert">{error}</p>}
        <div className="fm-modal-actions">
          <button type="button" className="fm-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="fm-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Post"}</button>
        </div>
      </form>
    </div>
  );
};

export default ThreadForm;
