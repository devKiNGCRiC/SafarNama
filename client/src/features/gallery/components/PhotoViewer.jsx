import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import PhotoView from "./PhotoView";
import { neighbour } from "../utils/galleryFormat";
import "../gallery.scss";

// Lightbox over the grid: Esc closes, arrow keys / buttons move between photos.
const PhotoViewer = ({ items, id, onSelect, onClose, onChange, onDeleted }) => {
  const photo = items.find((p) => p._id === id);
  const prev = neighbour(items, id, -1);
  const next = neighbour(items, id, 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea")) return; // typing a comment must not flip photos
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && prev) onSelect(prev);
      if (e.key === "ArrowRight" && next) onSelect(next);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [prev, next, onSelect, onClose]);

  if (!photo) return null;

  return (
    <div className="gl-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <button type="button" className="gl-close" aria-label="Close" onClick={onClose}><X size={26} /></button>
      {prev && <button type="button" className="gl-nav prev" aria-label="Previous photo" onClick={() => onSelect(prev)}><ChevronLeft size={30} /></button>}
      {next && <button type="button" className="gl-nav next" aria-label="Next photo" onClick={() => onSelect(next)}><ChevronRight size={30} /></button>}
      <div className="gl-viewer">
        <PhotoView photo={photo} onChange={onChange} onDeleted={onDeleted} />
      </div>
    </div>
  );
};

export default PhotoViewer;
