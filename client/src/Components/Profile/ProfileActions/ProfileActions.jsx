import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    UserPlus, 
    UserMinus, 
    Share2, 
    Mail, 
    Flag, 
    MoreHorizontal 
} from 'lucide-react';
import './ProfileActions.scss';

const ProfileActions = ({ 
    isOwnProfile, 
    isFollowing, 
    onFollow, 
    onUnfollow,
    username,
    isLoading 
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    const handleFollowAction = () => {
        if (isFollowing) {
            onUnfollow();
        } else {
            onFollow();
        }
    };

    const handleShare = async () => {
        try {
            const profileUrl = `${window.location.origin}/profile/${username}`;
            await navigator.clipboard.writeText(profileUrl);
            // You can add a toast notification here
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <div className="profile-actions">
            {!isOwnProfile && (
                <>
                    <button 
                        className={`follow-button ${isFollowing ? 'following' : ''}`}
                        onClick={handleFollowAction}
                        disabled={isLoading}
                    >
                        {isFollowing ? (
                            <>
                                <UserMinus size={18} />
                                <span>Following</span>
                            </>
                        ) : (
                            <>
                                <UserPlus size={18} />
                                <span>Follow</span>
                            </>
                        )}
                    </button>

                    <button className="message-button" onClick={() => navigate(`/chat/with/${username}`)}>
                        <Mail size={18} />
                        <span>Message</span>
                    </button>
                </>
            )}

            <button className="share-button" onClick={handleShare}>
                <Share2 size={18} />
            </button>

            <div className="more-actions">
                <button 
                    className="more-button"
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <MoreHorizontal size={18} />
                </button>

                {showDropdown && (
                    <div className="dropdown-menu">
                        {!isOwnProfile && (
                            <button className="dropdown-item">
                                <Flag size={16} />
                                <span>Report Profile</span>
                            </button>
                        )}
                        {/* Add more dropdown items as needed */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileActions;