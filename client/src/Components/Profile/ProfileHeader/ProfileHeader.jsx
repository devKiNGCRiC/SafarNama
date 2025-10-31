import React, { useState } from 'react';
import { Camera, Edit2, Link as LinkIcon, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './ProfileHeader.scss';

import img1 from '../../../Assets/avatar.jpg';
import img2 from '../../../Assets/img/cover.jpg';
const ProfileHeader = ({ user, profile, isOwnProfile, onUpdateProfilePicture, onUpdateCoverPhoto }) => {
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPG or PNG)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('File size should not exceed 5MB');
            return;
        }

        try {
            setUploadingAvatar(true);
            const formData = new FormData();
            formData.append('avatar', file);
            
            // Log the FormData contents for debugging
            for (let pair of formData.entries()) {
                console.log('Uploading',pair[0], pair[1]);
            }
    
            const result = await onUpdateProfilePicture(formData);
            if (result.success) {
                toast.success('Profile picture updated successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.message || 'Failed to update profile picture');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCoverChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPG or PNG)');
            return;
        }
    
        try {
            setUploadingCover(true);
            const formData = new FormData();
            formData.append('cover', file); // Make sure this matches your backend field name
    
            // Log for debugging
            for (let pair of formData.entries()) {
                console.log('Cover upload formData:', pair[0], pair[1]);
            }
    
            const result = await onUpdateCoverPhoto(formData);
            
            if (result?.success) {
                toast.success('Cover photo updated successfully');
            } else {
                throw new Error(result?.error || 'Failed to update cover photo');
            }
        } catch (error) {
            console.error('Cover upload error:', error);
            toast.error(error.message || 'Failed to update cover photo');
        } finally {
            setUploadingCover(false);
        }
    };

    // In your ProfileHeader component
    const handleUploadError = (error) => {
        console.error('Upload error:', error);
        if (error.response?.status === 413) {
            toast.error('File size too large. Please upload a smaller image.');
        } else if (error.response?.status === 415) {
            toast.error('Invalid file type. Please upload a JPG or PNG image.');
        } else {
            toast.error(error.response?.data?.message || 'Failed to upload image');
        }
    };

    return (
        <div className="profile-header">
            <div className="cover-photo-container">
                <img 
                    src={profile?.coverImage || img2 } 
                    alt="Cover"
                    className="cover-photo"
                />
                {isOwnProfile && (
                    <div className="cover-controls">
                        <input
                            type="file"
                            id="cover-upload"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleCoverChange}
                            disabled={uploadingCover}
                            hidden
                        />
                        <label htmlFor="cover-upload" className="upload-button">
                            <Camera size={18} />
                            <span>{uploadingCover ? 'Uploading...' : 'Change Cover'}</span>
                        </label>
                    </div>
                )}
            </div>

            <div className="profile-header-main">
                <div className="profile-photo-section">
                    <div className="profile-photo-container">
                        <img 
                            src={user?.avatar || img1 } 
                            alt={user?.username}
                            className="profile-photo"
                        />
                        {isOwnProfile && (
                            <div className="photo-controls">
                                <input
                                    type="file"
                                    id="avatar-upload"
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={handleAvatarChange}
                                    disabled={uploadingAvatar}
                                    hidden
                                />
                                <label htmlFor="avatar-upload" className="upload-button">
                                    <Camera size={16} />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-info-section">
                    <div className="profile-names">
                        <h1>{user?.username}</h1>
                        {user?.firstname && user?.lastname && (
                            <h2>{`${user.firstname} ${user.lastname}`}</h2>
                        )}
                    </div>

                    <div className="profile-details">
                        {profile?.bio && (
                            <p className="bio">{profile.bio}</p>
                        )}

                        <div className="meta-info">
                            {profile?.location && (
                                <span className="location">
                                    <MapPin size={16} />
                                    {profile.location}
                                </span>
                            )}
                            {profile?.website && (
                                <a 
                                    href={profile.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="website"
                                >
                                    <LinkIcon size={16} />
                                    {new URL(profile.website).hostname}
                                </a>
                            )}
                        </div>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{profile?.followers?.length || 0}</span>
                                <span className="stat-label">Followers</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{profile?.following?.length || 0}</span>
                                <span className="stat-label">Following</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{profile?.posts?.length || 0}</span>
                                <span className="stat-label">Posts</span>
                            </div>
                            {profile?.blogs?.length > 0 && (
                                <div className="stat-item">
                                    <span className="stat-value">{profile.blogs.length}</span>
                                    <span className="stat-label">Blogs</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;