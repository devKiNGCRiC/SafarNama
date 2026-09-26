import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { UserPlus, UserMinus, Share2, Mail } from 'lucide-react';
import './ProfileActions.scss';

const ProfileActions = ({ 
    isOwnProfile, 
    isFollowing, 
    onFollow, 
    onUnfollow,
    username,
    isLoading 
}) => {
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
            toast.success('Profile link copied');
        } catch {
            toast.error('Could not copy the link');
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

        </div>
    );
};

export default ProfileActions;