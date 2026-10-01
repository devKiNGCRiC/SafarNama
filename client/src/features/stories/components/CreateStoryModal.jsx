import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { createStory } from "../api";
import { storyFileProblem } from "../utils/storyFormat";
import "../stories.scss";

const CreateStoryModal = ({ onClose, onCreated }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const choose = (e) => {
    const picked = e.target.files?.[0] || null;
    const problem = picked ? storyFileProblem(picked) : null;
    setError(problem || "");
    setFile(problem ? null : picked);
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = storyFileProblem(file);
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      const res = await createStory({ file, caption: caption.trim() }, setProgress);
      toast.success("Your story is live for 24 hours");
      onCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not share your story. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="st-create" onSubmit={submit}>
        <h2>Add to your story</h2>

        <label htmlFor="st-file" className={`st-dropzone ${preview ? "has-preview" : ""}`}>
          {preview ? (
            file.type.startsWith("video/") ? <video src={preview} muted playsInline /> : <img src={preview} alt="Preview" />
          ) : (
            <span>Choose a photo or video<small>JPG, PNG, WEBP or MP4, MOV, WEBM · up to 50 MB</small></span>
          )}
          <input id="st-file" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={choose} hidden />
        </label>

        <label htmlFor="st-caption">Caption (optional)</label>
        <input id="st-caption" maxLength={200} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Say something about this moment…" />

        {busy && <div className="st-progress"><span style={{ width: `${progress}%` }} /></div>}
        {error && <p className="st-error" role="alert">{error}</p>}

        <div className="st-create-actions">
          <button type="button" className="st-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="st-btn" disabled={busy || !file}>{busy ? "Sharing…" : "Share to story"}</button>
        </div>
      </form>
    </div>
  );
};

export default CreateStoryModal;
