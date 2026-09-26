import React, { useEffect, useState } from "react";
import { getPhotos } from "../api";
import PhotoGrid from "../components/PhotoGrid";
import "../gallery.scss";

const GalleryPage = () => {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");

  // wait a moment after typing before asking the server
  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(timer);
  }, [input]);

  return (
    <div className="gl-page">
      <div className="gl-wrap">
        <div className="gl-head">
          <h1>Travel Gallery</h1>
          <p>Photos from the SafarNama community</p>
        </div>
        <PhotoGrid
          fetchPage={(cursor) => getPhotos({ search, cursor })}
          deps={[search]}
          emptyTitle={search ? "No photos match your search" : "No photos yet"}
          emptyText={search ? "Try a different place or word." : "Be the first to share a photo from your journey!"}
          toolbar={
            <input className="gl-search" type="search" placeholder="Search by place or caption…" value={input} onChange={(e) => setInput(e.target.value)} />
          }
        />
      </div>
    </div>
  );
};

export default GalleryPage;
