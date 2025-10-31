import React, { useState } from 'react';
import { Camera, Upload, Image, X, MapPin, Heart, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Gallery.scss';

const Gallery = ({ photos = [], isOwnProfile, onPhotoUpload, onPhotoDelete }) => {
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [uploadMode, setUploadMode] = useState(false);
    const [uploadData, setUploadData] = useState({
        file: null,
        caption: '',
        location: ''
    });

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload an image file');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadData(prev => ({
                    ...prev,
                    file,
                    preview: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async () => {
        try {
            if (!uploadData.file) {
                toast.error('Please select an image');
                return;
            }

            const formData = new FormData();
            formData.append('photo', uploadData.file);
            formData.append('caption', uploadData.caption);
            formData.append('location', uploadData.location);

            await onPhotoUpload(formData);
            toast.success('Photo uploaded successfully');
            setUploadMode(false);
            setUploadData({ file: null, caption: '', location: '' });
        } catch (error) {
            toast.error('Failed to upload photo');
        }
    };

    return (
        <div className="gallery-container">
            {isOwnProfile && (
                <button 
                    className="add-photo-btn"
                    onClick={() => setUploadMode(true)}
                >
                    <Camera size={20} />
                    Add Photo
                </button>
            )}

            {uploadMode && (
                <div className="upload-modal">
                    <div className="modal-content">
                        <button 
                            className="close-btn"
                            onClick={() => setUploadMode(false)}
                        >
                            <X size={24} />
                        </button>

                        <div className="upload-area">
                            {uploadData.preview ? (
                                <div className="preview-container">
                                    <img 
                                        src={uploadData.preview} 
                                        alt="Preview" 
                                    />
                                    <button 
                                        onClick={() => setUploadData({ file: null, caption: '', location: '' })}
                                        className="remove-preview"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        id="photo-upload"
                                        hidden
                                    />
                                    <label htmlFor="photo-upload" className="upload-label">
                                        <Upload size={40} />
                                        <span>Click to upload or drag and drop</span>
                                        <span className="file-info">PNG, JPG up to 10MB</span>
                                    </label>
                                </div>
                            )}

                            <div className="upload-form">
                                <input
                                    type="text"
                                    placeholder="Add a caption..."
                                    value={uploadData.caption}
                                    onChange={e => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                                    className="caption-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Add location..."
                                    value={uploadData.location}
                                    onChange={e => setUploadData(prev => ({ ...prev, location: e.target.value }))}
                                    className="location-input"
                                />
                                <button 
                                    className="upload-btn"
                                    onClick={handleUpload}
                                    disabled={!uploadData.file}
                                >
                                    Upload Photo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="gallery-grid">
                {photos.map((photo) => (
                    <div 
                        key={photo._id} 
                        className="gallery-item"
                        onClick={() => setSelectedPhoto(photo)}
                    >
                        <img src={photo.url} alt={photo.caption} />
                        <div className="photo-overlay">
                            <div className="photo-stats">
                                <span><Heart size={16} /> {photo.likes?.length || 0}</span>
                                <span><MessageCircle size={16} /> {photo.comments?.length || 0}</span>
                            </div>
                            {photo.location && (
                                <div className="photo-location">
                                    <MapPin size={16} />
                                    <span>{photo.location}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedPhoto && (
                <PhotoModal 
                    photo={selectedPhoto}
                    onClose={() => setSelectedPhoto(null)}
                    isOwnProfile={isOwnProfile}
                    onDelete={onPhotoDelete}
                />
            )}
        </div>
    );
};

const PhotoModal = ({ photo, onClose, isOwnProfile, onDelete }) => {
    // ... PhotoModal implementation coming in next comment due to length
    return (
        <div className="photo-modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Modal content implementation */}
            </div>
        </div>
    );
};

export default Gallery;