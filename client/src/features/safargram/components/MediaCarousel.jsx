import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MediaCarousel = ({ media = [] }) => {
  const track = useRef(null);
  const [index, setIndex] = useState(0);

  const go = (delta) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: delta * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="sg-media">
      <div className="sg-track" ref={track} onScroll={onScroll}>
        {media.map((item) => (
          <div className="sg-slide" key={item.publicId}>
            {item.type === "video" ? (
              <video src={item.url} controls playsInline preload="metadata" />
            ) : (
              <img src={item.url} alt="" loading="lazy" />
            )}
          </div>
        ))}
      </div>
      {media.length > 1 && (
        <>
          {index > 0 && (
            <button type="button" className="sg-arrow prev" aria-label="Previous" onClick={() => go(-1)}>
              <ChevronLeft size={18} />
            </button>
          )}
          {index < media.length - 1 && (
            <button type="button" className="sg-arrow next" aria-label="Next" onClick={() => go(1)}>
              <ChevronRight size={18} />
            </button>
          )}
          <div className="sg-dots">
            {media.map((m, i) => (
              <span key={m.publicId} className={i === index ? "on" : ""} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCarousel;
