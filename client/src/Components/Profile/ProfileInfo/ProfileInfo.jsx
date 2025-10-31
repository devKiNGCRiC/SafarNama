import React from 'react';
import { MapPin, Briefcase, Calendar, Globe, Award, Edit2, Mail, Phone, Link as LinkIcon } from 'lucide-react';
import './ProfileInfo.scss';

const ProfileInfo = ({ user, profile, isOwnProfile, onEditClick }) => {
    return (
        <div className="profile-info-container">
            <div className="info-header">
                <h2>Profile Information</h2>
                {isOwnProfile && (
                    <button className="edit-profile-btn" onClick={onEditClick}>
                        <Edit2 size={18} />
                        <span>Edit Profile</span>
                    </button>
                )}
            </div>

            <div className="info-section">
                <div className="basic-info">
                    <h3>Basic Information</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Name</span>
                            <span className="value">
                                {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                        {profile?.bio && (
                            <div className="info-item full-width">
                                <span className="label">Bio</span>
                                <p className="value bio">{profile.bio}</p>
                            </div>
                        )}
                        {user?.email && (
                            <div className="info-item">
                                <span className="label">
                                    <Mail size={16} /> Email
                                </span>
                                <span className="value">{user.email}</span>
                            </div>
                        )}
                        {profile?.phone && (
                            <div className="info-item">
                                <span className="label">
                                    <Phone size={16} /> Phone
                                </span>
                                <span className="value">{profile.phone}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="location-work">
                    {(profile?.location || profile?.occupation) && (
                        <>
                            <h3>Location & Work</h3>
                            <div className="info-grid">
                                {profile?.location && (
                                    <div className="info-item">
                                        <MapPin className="icon" size={16} />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile?.occupation && (
                                    <div className="info-item">
                                        <Briefcase className="icon" size={16} />
                                        <span>{profile.occupation}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {profile?.interests && profile.interests.length > 0 && (
                    <div className="interests-section">
                        <h3>Interests</h3>
                        <div className="interests-grid">
                            {profile.interests.map((interest, index) => (
                                <span key={index} className="interest-tag">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {profile?.socialLinks && profile.socialLinks.length > 0 && (
                    <div className="social-links">
                        <h3>Social Links</h3>
                        <div className="links-grid">
                            {profile.socialLinks.map((link, index) => (
                                <a 
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="social-link"
                                >
                                    <LinkIcon size={16} />
                                    <span>{link.platform}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="join-date">
                    <Calendar size={16} />
                    <span>Joined {new Date(user?.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                    })}</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;