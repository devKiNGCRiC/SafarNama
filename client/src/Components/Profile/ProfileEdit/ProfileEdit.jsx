// client/src/Components/Profile/ProfileEdit/ProfileEdit.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SOCIAL_PLATFORMS, safeHref } from '../../../features/profile/utils/profileLinks';
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
        socialLinks: profile?.socialLinks || []
    });

    const [saving, setSaving] = useState(false);
    const [newInterest, setNewInterest] = useState('');
    const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddInterest = () => {
        if (!newInterest.trim()) return;
        if (formData.interests.some((i) => i.toLowerCase() === newInterest.trim().toLowerCase())) {
            toast.error('Interest already exists');
            return;
        }
        if (formData.interests.length >= 10) {
            toast.error('You can add up to 10 interests');
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

        const url = safeHref(newSocialLink.url);
        if (!url) {
            toast.error('Please enter a valid web address, like https://instagram.com/yourname');
            return;
        }
        if (formData.socialLinks.length >= 5) {
            toast.error('You can add up to 5 links');
            return;
        }
        if (formData.socialLinks.some((l) => l.platform === newSocialLink.platform)) {
            toast.error('You already added a link for that platform');
            return;
        }

        setFormData(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { platform: newSocialLink.platform, url }]
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

            // Send every field, empty ones included, so a bio / website / list can be cleared.
            // The server checks and cleans each value and explains what is wrong.
            const updateData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                bio: formData.bio.trim(),
                location: formData.location.trim(),
                occupation: formData.occupation.trim(),
                website: formData.website.trim(),
                interests: formData.interests,
                socialLinks: formData.socialLinks
            };

            setSaving(true);
            const result = await onSave(updateData);
            if (result.success) {
                toast.success('Profile updated successfully');
                onClose();
            } else {
                throw new Error(result.error || 'Failed to update profile');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
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
                    {/* The profile picture and cover photo are changed on the profile header itself. */}

                    <div className="form-section">
                        <h3>Basic Information</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    maxLength={50}
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
                                    maxLength={50}
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
                                maxLength={500}
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
                                    maxLength={80}
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
                                    maxLength={80}
                                    value={formData.occupation}
                                    onChange={handleInputChange}
                                    placeholder="Your occupation"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Website</label>
                            <input
                                type="text"
                                maxLength={200}
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
                                maxLength={30}
                                onChange={(e) => setNewInterest(e.target.value)}
                                placeholder="Add an interest"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())}
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
                                {SOCIAL_PLATFORMS.map((p) => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
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
                        <button type="submit" className="save-btn" disabled={saving}>
                            <Save size={20} />
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEdit;