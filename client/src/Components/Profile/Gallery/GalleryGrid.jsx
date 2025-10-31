// client/src/components/Profile/ProfileTabs/GalleryGrid.jsx
import React, { useState } from 'react';
import { Camera, Heart, MessageCircle, Share2 } from 'lucide-react';
import './GalleryGrid.scss';

const GalleryGrid = ({ photos = [] }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const handlePhotoClick = (photo) => {
        setSelectedPhoto(photo);
    };

    const closeModal = () => {
        setSelectedPhoto(null);
    };

    if (!photos.length) {
        return (
            <div className="empty-gallery">
                <Camera size={48} />
                <h3>No Photos Yet</h3>
                <p>Share your eco-tourism adventures with photos</p>
            </div>
        );
    }

    return (
        <>
            <div className="gallery-grid">
                {photos.map((photo) => (
                    <div 
                        key={photo._id} 
                        className="gallery-item"
                        onClick={() => handlePhotoClick(photo)}
                    >
                        <img src={photo.url} alt={photo.caption} />
                        <div className="gallery-item-overlay">
                            <div className="photo-stats">
                                <span><Heart size={16} /> {photo.likes}</span>
                                <span><MessageCircle size={16} /> {photo.comments}</span>
                            </div>
                            <div className="photo-location">
                                <span>{photo.location}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedPhoto && (
                <div className="photo-modal" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-image">
                            <img src={selectedPhoto.url} alt={selectedPhoto.caption} />
                        </div>
                        <div className="modal-info">
                            <div className="photo-header">
                                <div className="user-info">
                                    <img src={selectedPhoto.user.avatar} alt={selectedPhoto.user.name} />
                                    <div>
                                        <h4>{selectedPhoto.user.name}</h4>
                                        <span>{selectedPhoto.location}</span>
                                    </div>
                                </div>
                                <button className="share-btn">
                                    <Share2 size={20} />
                                </button>
                            </div>
                            <div className="photo-description">
                                <p>{selectedPhoto.caption}</p>
                                <span className="date">
                                    {new Date(selectedPhoto.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="photo-actions">
                                <button className="like-btn">
                                    <Heart size={20} />
                                    <span>{selectedPhoto.likes} likes</span>
                                </button>
                                <button className="comment-btn">
                                    <MessageCircle size={20} />
                                    <span>{selectedPhoto.comments} comments</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GalleryGrid;