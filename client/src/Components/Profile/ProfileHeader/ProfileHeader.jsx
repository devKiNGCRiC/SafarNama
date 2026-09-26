import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fullName } from '../../../features/profile/utils/profileLinks';
import './ProfileHeader.scss';

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_MB = 5;

// Cover photo, avatar, name, short bio and the counts. `children` are the action buttons
// (Edit / Follow / Message ...), which sit next to the name.
const ProfileHeader = ({ user, profile, counts, isOwnProfile, onUpdateProfilePicture, onUpdateCoverPhoto, children }) => {
    const [busy, setBusy] = useState({ avatar: false, cover: false });

    // Checks the chosen photo, uploads it, and tells the person what happened.
    const upload = async (event, field, send, done) => {
        const file = event.target.files?.[0];
        event.target.value = ''; // lets the same file be chosen again later
        if (!file) return;
        if (!PHOTO_TYPES.includes(file.type)) return toast.error('Please upload a JPG, PNG or WEBP photo');
        if (file.size > MAX_MB * 1024 * 1024) return toast.error(`The photo must be smaller than ${MAX_MB} MB`);

        setBusy((b) => ({ ...b, [field]: true }));
        try {
            const formData = new FormData();
            formData.append(field, file);
            const result = await send(formData);
            if (result?.success) toast.success(done);
            else toast.error(result?.error || 'The upload failed. Please try again.');
        } finally {
            setBusy((b) => ({ ...b, [field]: false }));
        }
    };

    const displayName = fullName(user) || user?.username;
    const initial = (user?.username || '?')[0].toUpperCase();

    return (
        <header className="pf-header">
            <div
                className={`pf-cover ${profile?.coverImage ? 'has-image' : ''}`}
                style={profile?.coverImage ? { backgroundImage: `url(${profile.coverImage})` } : undefined}
            >
                {isOwnProfile && (
                    <label className="pf-cover-edit" title="Change cover photo">
                        <input type="file" accept={PHOTO_TYPES.join(',')} hidden disabled={busy.cover}
                            onChange={(e) => upload(e, 'cover', onUpdateCoverPhoto, 'Cover photo updated')} />
                        <Camera size={16} /> <span>{busy.cover ? 'Uploading…' : 'Change cover'}</span>
                    </label>
                )}
            </div>

            <div className="pf-head-body">
                <div className="pf-avatar">
                    {user?.avatar ? <img src={user.avatar} alt={user.username} /> : <b aria-hidden="true">{initial}</b>}
                    {isOwnProfile && (
                        <label className="pf-avatar-edit" title="Change profile picture">
                            <input type="file" accept={PHOTO_TYPES.join(',')} hidden disabled={busy.avatar}
                                onChange={(e) => upload(e, 'avatar', onUpdateProfilePicture, 'Profile picture updated')} />
                            <Camera size={15} />
                            <span className="sr-only">Change profile picture</span>
                        </label>
                    )}
                    {busy.avatar && <span className="pf-avatar-busy" aria-label="Uploading" />}
                </div>

                <div className="pf-identity">
                    <h1>{displayName}</h1>
                    <p className="pf-handle">@{user?.username}</p>
                    {profile?.bio && <p className="pf-bio">{profile.bio}</p>}
                    <ul className="pf-stats">
                        <li><b>{counts?.posts || 0}</b> <span>Posts</span></li>
                        <li><b>{profile?.followers?.length || 0}</b> <span>Followers</span></li>
                        <li><b>{profile?.following?.length || 0}</b> <span>Following</span></li>
                    </ul>
                </div>

                <div className="pf-actions">{children}</div>
            </div>
        </header>
    );
};

export default ProfileHeader;
