import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { uploadPhoto } from "../api";
import { fileProblem } from "../utils/galleryFormat";
import "../gallery.scss";

const UploadPhotoModal = ({ onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const choose = (e) => {
    const picked = e.target.files?.[0] || null;
    const problem = picked ? fileProblem(picked) : null;
    setError(problem || "");
    setFile(problem ? null : picked);
  };

  const submit = async (e) => {
    e.preventDefault();
    const problem = fileProblem(file);
    if (problem) return setError(problem);
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await uploadPhoto({ file, caption: caption.trim(), location: place.trim() });
      toast.success("Photo added to the Gallery");
      onUploaded(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload the photo. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="gl-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <form className="gl-modal" onSubmit={submit}>
        <h2>Add a photo</h2>

        <label htmlFor="gl-file">Photo (JPG, PNG or WEBP, up to 8 MB)</label>
        <input id="gl-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={choose} />
        {preview && <img className="gl-preview" src={preview} alt="Preview" />}

        <label htmlFor="gl-caption">Caption (optional)</label>
        <textarea id="gl-caption" rows={3} maxLength={300} value={caption} onChange={(e) => setCaption(e.target.value)} />

        <label htmlFor="gl-place">Where was it taken? (optional)</label>
        <input id="gl-place" maxLength={80} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Hampi, Karnataka" />

        {error && <p className="gl-error" role="alert">{error}</p>}
        <div className="gl-edit-actions">
          <button type="button" className="gl-btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="gl-btn" disabled={busy || !file}>{busy ? "Uploading…" : "Add photo"}</button>
        </div>
      </form>
    </div>
  );
};

export default UploadPhotoModal;
