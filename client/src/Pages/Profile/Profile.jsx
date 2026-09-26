import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

// Components
import ProfileHeader from '../../Components/Profile/ProfileHeader/ProfileHeader';
import ProfileInfo from '../../Components/Profile/ProfileInfo/ProfileInfo';
import ProfileTabs from '../../Components/Profile/ProfileTabs/ProfileTabs';
import ProfileEdit from '../../Components/Profile/ProfileEdit/ProfileEdit';
import ProfileActions from '../../Components/Profile/ProfileActions/ProfileActions';
import Loader from '../../Components/Loader/Loader';
import ErrorMessage from '../../Components/common/ErrorMessage';
import { sameUsername } from '../../features/profile/utils/profileLinks';

// Actions
import {
    getProfile,
    updateProfile,
    updateProfilePicture,
    updateCoverPhoto,
    followUserAction,
    unfollowUserAction
} from '../../actions/profileActions';
import { clearProfile } from '../../store/reducers/profileSlice';
import './Profile.scss';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const { profile, loading, error } = useSelector((state) => state.profile);
    const { user: currentUser } = useSelector((state) => state.auth);

    // "/profile" (no name) means my own profile
    const targetUsername = username || currentUser?.username;
    const isOwnProfile = !username || sameUsername(username, currentUser?.username);
    // The login response has `id`, not `_id`; followers are stored as user ids.
    const myId = currentUser?.id || currentUser?._id;

    const load = useCallback(async () => {
        const result = await dispatch(getProfile(username || currentUser?.username));
        setNotFound(Boolean(result.notFound));
    }, [dispatch, username, currentUser?.username]);

    // One load per profile. The previous person's data is cleared first, so nobody ever sees
    // someone else's profile while the new one loads.
    useEffect(() => {
        if (!targetUsername) {
            navigate('/auth', { replace: true });
            return;
        }
        setNotFound(false);
        setActiveTab('posts');
        setIsEditing(false);
        dispatch(clearProfile());
        load();
    }, [targetUsername]); // eslint-disable-line react-hooks/exhaustive-deps

    if (notFound) {
        return (
            <div className="pf-page" style={{ textAlign: 'center' }}>
                <h2>We could not find that traveller</h2>
                <p>The profile may have been renamed or removed.</p>
                <Link to="/safargram/explore">Find people on SafarGram</Link>
            </div>
        );
    }
    if (error && !profile) {
        return <ErrorMessage message={error} onRetry={load} />;
    }
    // (also covers the split second when the store still holds the previous person's profile)
    if (!profile || loading || !sameUsername(profile.user?.username, targetUsername)) {
        return <Loader fullScreen />;
    }

    const isFollowing = (profile.profile?.followers || []).some((f) => String(f?._id ?? f) === String(myId));

    const handleProfileUpdate = async (data) => {
        const result = await dispatch(updateProfile(data));
        if (result.success) setIsEditing(false);
        return result;
    };

    const changeFollow = async (follow) => {
        if (!currentUser) {
            navigate('/auth');
            return;
        }
        setLoadingFollow(true);
        try {
            const action = follow ? followUserAction : unfollowUserAction;
            const result = await dispatch(action(profile.user._id));
            if (result.success) toast.success(follow ? `Following ${profile.user.username}` : `Unfollowed ${profile.user.username}`);
            else toast.error(result.error || `Could not ${follow ? 'follow' : 'unfollow'} this person`);
        } finally {
            setLoadingFollow(false);
        }
    };

    return (
        <div className="pf-page">
            <div className="pf-shell">
                <ProfileHeader
                    user={profile.user}
                    profile={profile.profile}
                    counts={profile.counts}
                    isOwnProfile={isOwnProfile}
                    onUpdateProfilePicture={(file) => dispatch(updateProfilePicture(file))}
                    onUpdateCoverPhoto={(file) => dispatch(updateCoverPhoto(file))}
                >
                    <ProfileActions
                        isOwnProfile={isOwnProfile}
                        isFollowing={isFollowing}
                        onFollow={() => changeFollow(true)}
                        onUnfollow={() => changeFollow(false)}
                        onEdit={() => setIsEditing(true)}
                        username={profile.user.username}
                        isLoading={loadingFollow}
                    />
                </ProfileHeader>

                <div className="pf-main">
                    <aside className="pf-side">
                        <ProfileInfo
                            user={profile.user}
                            profile={profile.profile}
                            isOwnProfile={isOwnProfile}
                            onEditClick={() => setIsEditing(true)}
                        />
                    </aside>

                    <main className="pf-content">
                        <ProfileTabs
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            blogs={profile.blogs || []}
                            counts={profile.counts}
                            isOwnProfile={isOwnProfile}
                            username={profile.user.username}
                        />
                    </main>
                </div>
            </div>

            {isEditing && (
                <ProfileEdit
                    user={profile.user}
                    profile={profile.profile}
                    onClose={() => setIsEditing(false)}
                    onSave={handleProfileUpdate}
                />
            )}
        </div>
    );
};

export default Profile;
