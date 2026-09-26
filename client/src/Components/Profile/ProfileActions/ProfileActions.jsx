import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Pencil, Settings, Share2, UserCheck, UserPlus, MessageCircle } from 'lucide-react';
import './ProfileActions.scss';

// The buttons next to the name. Your own profile: Edit + Settings. Someone else's: Follow + Message.
const ProfileActions = ({ isOwnProfile, isFollowing, onFollow, onUnfollow, onEdit, username, isLoading }) => {
    const navigate = useNavigate();

    const share = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`);
            toast.success('Profile link copied');
        } catch {
            toast.error('Could not copy the link');
        }
    };

    return (
        <div className="pf-buttons">
            {isOwnProfile ? (
                <>
                    <button type="button" className="pf-btn primary" onClick={onEdit}>
                        <Pencil size={16} /> Edit profile
                    </button>
                    <Link to="/settings" className="pf-btn ghost">
                        <Settings size={16} /> Settings
                    </Link>
                </>
            ) : (
                <>
                    <button
                        type="button"
                        className={`pf-btn ${isFollowing ? 'ghost' : 'primary'}`}
                        onClick={isFollowing ? onUnfollow : onFollow}
                        disabled={isLoading}
                        aria-pressed={isFollowing}
                    >
                        {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
                    </button>
                    <button type="button" className="pf-btn ghost" onClick={() => navigate(`/chat/with/${username}`)}>
                        <MessageCircle size={16} /> Message
                    </button>
                </>
            )}
            <button type="button" className="pf-btn icon" onClick={share} aria-label="Copy profile link" title="Copy profile link">
                <Share2 size={16} />
            </button>
        </div>
    );
};

export default ProfileActions;
