import React, { useState } from "react";
import { Camera, Heart, MapPin, MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useCursorList from "../../safargram/hooks/useCursorList";
import PhotoViewer from "./PhotoViewer";
import UploadPhotoModal from "./UploadPhotoModal";
import { photoAlt, tileRatio } from "../utils/galleryFormat";
import "../gallery.scss";

// A masonry wall of photos with "load more", the lightbox, and (optionally) an "Add photo" button.
// Used by the public /gallery page and by the Gallery tab on a profile.
const PhotoGrid = ({ fetchPage, deps, canUpload = true, emptyTitle, emptyText, toolbar }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore } = useCursorList(fetchPage, deps);
  const [openId, setOpenId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const replace = (card) => setItems((list) => list.map((p) => (p._id === card._id ? { ...p, ...card } : p)));
  const removed = (id) => {
    setItems((list) => list.filter((p) => p._id !== id));
    setOpenId(null);
  };

  const addPhoto = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add photos");
      navigate("/auth", { state: { from: location } });
      return;
    }
    setUploading(true);
  };

  return (
    <div className="gl-grid-area">
      <div className="gl-toolbar">
        {toolbar}
        {canUpload && <button type="button" className="gl-btn" onClick={addPhoto}>+ Add photo</button>}
      </div>

      {loading && <div className="gl-state">Loading photos…</div>}
      {error && <div className="gl-state">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="gl-state">
          <Camera size={44} />
          <h3>{emptyTitle}</h3>
          <p>{emptyText}</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="gl-masonry">
            {items.map((p) => (
              <button type="button" key={p._id} className="gl-tile" onClick={() => setOpenId(p._id)} aria-label={photoAlt(p)}>
                <span className="gl-tile-frame" style={{ paddingBottom: `${tileRatio(p) * 100}%` }}>
                  <img src={p.url} alt={photoAlt(p)} loading="lazy" />
                </span>
                <span className="gl-tile-overlay">
                  <span><Heart size={15} /> {p.likeCount}</span>
                  <span><MessageCircle size={15} /> {p.commentCount}</span>
                  {p.location && <span className="gl-tile-place"><MapPin size={14} /> {p.location}</span>}
                </span>
              </button>
            ))}
          </div>
          {hasMore && (
            <div className="gl-more">
              <button type="button" className="gl-btn ghost" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}

      {openId && (
        <PhotoViewer items={items} id={openId} onSelect={setOpenId} onClose={() => setOpenId(null)} onChange={replace} onDeleted={removed} />
      )}
      {uploading && (
        <UploadPhotoModal
          onClose={() => setUploading(false)}
          onUploaded={(photo) => {
            setItems((list) => [photo, ...list]);
            setUploading(false);
          }}
        />
      )}
    </div>
  );
};

export default PhotoGrid;
