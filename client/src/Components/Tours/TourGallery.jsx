// src/Components/Tours/TourGallery.jsx
import React, { useState } from 'react';
import './TourGallery.css';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const TourGallery = ({ images }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <div className="tour-gallery">
      <div className="gallery-grid">
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`gallery-item ${index === 0 ? 'main-image' : ''}`}
            onClick={() => openLightbox(index)}
          >
            <img src={image} alt={`Tour view ${index + 1}`} />
          </div>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="close-btn">
            <X size={24} />
          </button>
          <button className="nav-btn prev" onClick={prevImage}>
            <ChevronLeft size={24} />
          </button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img src={images[currentImageIndex]} alt={`Tour view ${currentImageIndex + 1}`} />
          </div>
          <button className="nav-btn next" onClick={nextImage}>
            <ChevronRight size={24} />
          </button>
          <div className="image-counter">
            {currentImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourGallery;