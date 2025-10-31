import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

// Components
import ProfileHeader from '../../Components/Profile/ProfileHeader/ProfileHeader';
import ProfileInfo from '../../Components/Profile/ProfileInfo/ProfileInfo';
import ProfileTabs from '../../Components/Profile/ProfileTabs/ProfileTabs';
import ProfileEdit from '../../Components/Profile/ProfileEdit/ProfileEdit';
// import ProfileStats from '../../components/Profile/ProfileStats/ProfileStats';
import ProfileActions from '../../Components/Profile/ProfileActions/ProfileActions';
import Loader from '../../Components/Loader/Loader';
import ErrorMessage from '../../Components/common/ErrorMessage';

// Actions
import { 
    getProfile, 
    updateProfile, 
    updateProfilePicture, 
    updateCoverPhoto,
    followUserAction,
    unfollowUserAction 
} from '../../actions/profileActions';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Local state
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // Redux state
    const { 
        profile, 
        loading: profileLoading, 
        error: profileError 
    } = useSelector(state => state.profile);
    const { user: currentUser } = useSelector(state => state.auth);

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            try{
                setIsLoading(true);
                // If no username in URL, load current user's profile
                const targetUsername = username || currentUser?.username;
                console.log('Target username:', targetUsername);

                if (!targetUsername) {
                    console.log('No target username, redirecting to auth');
                    navigate('/auth');
                    return;
                }

                const result = await dispatch(getProfile(targetUsername));
                console.log('Profile load result:', result);

                if (isMounted) {
                    if (!result.success) {
                        toast.error(result.error || 'Failed to load profile');
                        if (result.error === 'Profile not found') {
                            navigate('/404');
                        }
                    }
                }
            } catch (error) {
                console.error('Profile load error:', error);
                if (isMounted) {
                    toast.error('Error loading profile');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            isMounted = false;
        };
    }, [username, currentUser?.username, dispatch, navigate]);

    useEffect(() => {
        const loadProfileData = async () => {
            try {
                setIsLoading(true);
                const targetUsername = username || currentUser?.username;
                
                if (!targetUsername) {
                    navigate('/auth');
                    return;
                }
    
                // Log the profile data we're receiving
                console.log('Loading profile data for:', targetUsername);
                
                const result = await dispatch(getProfile(targetUsername));
                console.log('Profile load result:', result);
    
                if (!result.success) {
                    toast.error(result.error || 'Failed to load profile');
                    if (result.error === 'Profile not found') {
                        navigate('/404');
                    }
                }
            } catch (error) {
                console.error('Profile load error:', error);
                toast.error('Error loading profile');
            } finally {
                setIsLoading(false);
            }
        };
    
        loadProfileData();
    }, [username, currentUser?.username, dispatch, navigate]);

    // Add more console logs
    console.log('Profile from Redux:', profile);

    // Check if it's own profile
    const isOwnProfile = (username ? username === currentUser?.username : true || !username);
    const isFollowing = profile?.followers?.includes(currentUser?._id);

    console.log('Component State:', {
        isLoading,
        profileLoading,
        profile,
        currentUser,
        isOwnProfile
    });

    const handleProfileUpdate = async (data) => {
        const result = await dispatch(updateProfile(data));
        if (result.success) {
            toast.success('Profile updated successfully');
            setIsEditing(false);
            // Reload profile data
            dispatch(getProfile(username));
        } else {
            toast.error(result.error || 'Failed to update profile');
        }
    };

    const handleFollow = async () => {
        if (!currentUser) {
            navigate('/auth');
            return;
        }

        setLoadingFollow(true);
        try {
            const result = await dispatch(followUserAction(profile.user._id));
            if (result.success) {
                toast.success(`Following ${username}`);
            } else {
                toast.error(result.error || 'Failed to follow user');
            }
        } finally {
            setLoadingFollow(false);
        }
    };

    const handleUnfollow = async () => {
        setLoadingFollow(true);
        try {
            const result = await dispatch(unfollowUserAction(profile.user._id));
            if (result.success) {
                toast.success(`Unfollowed ${username}`);
            } else {
                toast.error(result.error || 'Failed to unfollow user');
            }
        } finally {
            setLoadingFollow(false);
        }
    };

    // Show loading state only on initial load
    if (profileLoading && !profile) {
        return <Loader fullScreen />;
    }

    // Show error state
    if (profileError) {
        return (
            <ErrorMessage 
                message={profileError}
                onRetry={() => dispatch(getProfile(username || currentUser?.username))}
            />
        );
    }

    if (!profile) {
        return <div>No profile data available</div>;
    }

    const profileData = {
        ...profile.user,
        ...profile.profile,
        isOwnProfile
    };

    return (
        <div className="profile-container">
            <ProfileHeader 
                user={profile.user}
                profile={profile.profile}
                isOwnProfile={isOwnProfile}
                onUpdateProfilePicture={(file) => dispatch(updateProfilePicture(file))}
                onUpdateCoverPhoto={(file) => dispatch(updateCoverPhoto(file))}
            />

        <div className="profile-content">
                {!isOwnProfile && (
                    <ProfileActions 
                        isOwnProfile={isOwnProfile}
                        isFollowing={profile.profile.followers?.includes(currentUser?._id)}
                        onFollow={() => handleFollow(profile.user._id)}
                        onUnfollow={() => handleUnfollow(profile.user._id)}
                        username={profile.user.username}
                        isLoading={loadingFollow}
                    />
                )}

                <div className="profile-main">
                    <div className="profile-left">
                        <ProfileInfo 
                            user={profile.user}
                            profile={profile.profile}
                            isOwnProfile={isOwnProfile}
                            onEditClick={() => setIsEditing(true)}
                        />
                    </div>

                    <div className="profile-right">
                        <ProfileTabs 
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            profile={profileData}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>
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