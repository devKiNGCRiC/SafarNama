// client/src/Components/Profile/ProfileEdit/ProfileEdit.jsx
import React, { useState } from 'react';
import { X, Camera, Plus, Trash2, Save, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './ProfileEdit.scss';

const ProfileEdit = ({ user, profile, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
        occupation: profile?.occupation || '',
        website: profile?.website || '',
        interests: profile?.interests || [],
        socialLinks: profile?.socialLinks || [],
        avatar: null,
        coverImage: null
    });

    const [imagePreview, setImagePreview] = useState({
        avatar: user?.avatar || null,
        cover: profile?.coverImage || null
    });

    const [newInterest, setNewInterest] = useState('');
    const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a valid image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(prev => ({
                ...prev,
                [type]: reader.result
            }));
            setFormData(prev => ({
                ...prev,
                [type]: file
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddInterest = () => {
        if (!newInterest.trim()) return;
        if (formData.interests.includes(newInterest.trim())) {
            toast.error('Interest already exists');
            return;
        }
        setFormData(prev => ({
            ...prev,
            interests: [...prev.interests, newInterest.trim()]
        }));
        setNewInterest('');
    };

    const handleRemoveInterest = (index) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter((_, i) => i !== index)
        }));
    };

    const handleAddSocialLink = () => {
        if (!newSocialLink.platform || !newSocialLink.url) {
            toast.error('Please fill in both platform and URL');
            return;
        }

        if (!newSocialLink.url.startsWith('http')) {
            toast.error('Please enter a valid URL starting with http:// or https://');
            return;
        }

        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { ...newSocialLink }]
        }));
        setNewSocialLink({ platform: '', url: '' });
    };

    const handleRemoveSocialLink = (index) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            //const data = new FormData();

            // Create a clean data object without null or undefined values
            const updateData = {
                firstName: formData.firstName || undefined,
                lastName: formData.lastName || undefined,
                bio: formData.bio || undefined,
                location: formData.location || undefined,
                occupation: formData.occupation || undefined,
                website: formData.website || undefined,
                interests: formData.interests.length > 0 ? formData.interests : undefined,
                socialLinks: formData.socialLinks.length > 0 ? formData.socialLinks : undefined
            };
            Object.keys(updateData).forEach(key => 
                updateData[key] === undefined && delete updateData[key]
            );
    

            const result = await onSave(updateData);
        
            if (result.success) {
                toast.success('Profile updated successfully');
                onClose();
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error('Failed to update profile');
            console.error('Profile update error:', error);
        }
    };

    return (
        <div className="profile-edit-overlay" onClick={onClose}>
            <div className="profile-edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    {/* <div className="image-upload-section">
                        <div className="avatar-upload">
                            <h3>Profile Picture</h3>
                            <div className="preview-container">
                                <img 
                                    src={imagePreview.avatar || user?.avatar || '/default-avatar.jpg'} 
                                    alt="Profile" 
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileChange(e, 'avatar')}
                                    id="avatar-upload"
                                    hidden
                                />
                                <label htmlFor="avatar-upload" className="upload-label">
                                    <Camera size={20} />
                                </label>
                            </div>
                        </div>

                        <div className="cover-upload">
                            <h3>Cover Photo</h3>
                            <div className="preview-container">
                                <img 
                                    src={imagePreview.cover || profile?.coverImage || '/default-cover.jpg'} 
                                    alt="Cover" 
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileChange(e, 'coverImage')}
                                    id="cover-upload"
                                    hidden
                                />
                                <label htmlFor="cover-upload" className="upload-label">
                                    <Camera size={20} />
                                </label>
                            </div>
                        </div>
                    </div> */}

                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    placeholder="Your first name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    placeholder="Your last name"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                placeholder="Tell us about yourself..."
                                rows="4"
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="Your location"
                                />
                            </div>

                            <div className="form-group">
                                <label>Occupation</label>
                                <input
                                    type="text"
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleInputChange}
                                    placeholder="Your occupation"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Website</label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleInputChange}
                                placeholder="https://your-website.com"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Interests</h3>
                        <div className="interests-input">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                placeholder="Add an interest"
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
                            />
                            <button 
                                type="button" 
                                onClick={handleAddInterest}
                                className="add-btn"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="interests-list">
                            {formData.interests.map((interest, index) => (
                                <div key={index} className="interest-tag">
                                    <span>{interest}</span>
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveInterest(index)}
                                        className="remove-btn"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Social Links</h3>
                        <div className="social-input">
                            <select
                                value={newSocialLink.platform}
                                onChange={(e) => setNewSocialLink(prev => ({
                                    ...prev,
                                    platform: e.target.value
                                }))}
                            >
                                <option value="">Select Platform</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">Twitter</option>
                                <option value="instagram">Instagram</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="github">GitHub</option>
                            </select>
                            <input
                                type="url"
                                value={newSocialLink.url}
                                onChange={(e) => setNewSocialLink(prev => ({
                                    ...prev,
                                    url: e.target.value
                                }))}
                                placeholder="Enter URL"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddSocialLink}
                                className="add-btn"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        <div className="social-links-list">
                            {formData.socialLinks.map((link, index) => (
                                <div key={index} className="social-link-item">
                                    <LinkIcon size={16} />
                                    <div className="link-info">
                                        <span className="platform">{link.platform}</span>
                                        <span className="url">{link.url}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveSocialLink(index)}
                                        className="remove-btn"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn">
                            <Save size={20} />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;