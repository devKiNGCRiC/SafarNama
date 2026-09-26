import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPhoto } from "../api";
import PhotoView from "../components/PhotoView";
import "../gallery.scss";

// A single photo on its own address, so it can be shared.
const PhotoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setPhoto(null);
    setError("");
    getPhoto(id)
      .then((r) => alive && setPhoto(r.data))
      .catch((e) => alive && setError(e.response?.status === 404 ? "This photo does not exist (any more)." : "Could not load the photo."));
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="gl-page">
      <div className="gl-wrap">
        <p><Link to="/gallery">← Back to the Gallery</Link></p>
        {error && <div className="gl-state">{error}</div>}
        {!photo && !error && <div className="gl-state">Loading…</div>}
        {photo && (
          <div className="gl-viewer inline">
            <PhotoView photo={photo} onDeleted={() => navigate("/gallery", { replace: true })} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoPage;
