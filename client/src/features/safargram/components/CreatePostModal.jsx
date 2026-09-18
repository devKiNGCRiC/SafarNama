import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";
import { createPost } from "../api";
import { MEDIA_RULES, isVideo, validateSelection } from "../utils/mediaRules";
import DestinationPicker from "./DestinationPicker";
import "../safargram.scss";

const CATEGORIES = ["Trekking", "Wildlife", "Culture", "Eco-stay", "Beach", "Food", "Adventure", "Other"];

const CreatePostModal = ({ onClose, onCreated }) => {
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("Other");
  const [destination, setDestination] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);

  // Object URLs for previews; revoked when the selection changes or the modal closes.
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const addFiles = (list) => {
    const next = [...files, ...Array.from(list)];
    const problem = validateSelection(next);
    if (problem) {
      setError(problem);
    } else {
      setError("");
      setFiles(next);
    }
    if (input.current) input.current.value = "";
  };

  const removeFile = (index) => setFiles(files.filter((_, i) => i !== index));

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const problem = files.length === 0 ? "Add at least one photo or a video" : validateSelection(files);
    if (problem) return setError(problem);

    const form = new FormData();
    files.forEach((f) => form.append("media", f));
    form.append("caption", caption);
    form.append("category", category);
    if (destination) form.append("destinationId", destination._id);

    setSubmitting(true);
    setError("");
    setProgress(0);
    try {
      const { data } = await createPost(form, setProgress);
      toast.success("Posted to SafarGram!");
      onCreated(data);
    } catch (err) {
      // Keep the modal (and the user's work) open so they can retry.
      setError(err.response?.data?.message || "Upload failed. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="sg-overlay" onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose()}>
      <form className="sg-modal" onSubmit={submit}>
        <h3>Share your journey</h3>

        <button type="button" className="sg-btn ghost" onClick={() => input.current?.click()} disabled={submitting}>
          Add photos or a video
        </button>
        <input
          ref={input}
          type="file"
          hidden
          multiple
          accept={MEDIA_RULES.accept}
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="sg-previews">
          {files.map((f, i) => (
            <div className="sg-preview" key={`${f.name}-${i}`}>
              {isVideo(f) ? <video src={previews[i]} muted /> : <img src={previews[i]} alt="" />}
              {!submitting && (
                <button type="button" aria-label="Remove" onClick={() => removeFile(i)}>
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>

        <label htmlFor="sg-caption">Caption</label>
        <textarea
          id="sg-caption"
          rows={4}
          maxLength={2200}
          placeholder="Tell the story… use #hashtags"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={submitting}
        />

        <label htmlFor="sg-category">Category</label>
        <select id="sg-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={submitting}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <label>Destination</label>
        <DestinationPicker value={destination} onChange={setDestination} />

        {submitting && (
          <div className="sg-progress" role="progressbar" aria-valuenow={progress}>
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && <div className="sg-error">{error}</div>}

        <div className="sg-modal-actions">
          <button type="button" className="sg-btn ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="sg-btn" disabled={submitting}>
            {submitting ? (progress < 100 ? `Uploading ${progress}%` : "Processing…") : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostModal;
