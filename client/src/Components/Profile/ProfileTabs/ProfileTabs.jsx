import React, { useState } from 'react';
import { Grid, BookOpen, Bookmark, Image, Navigation } from 'lucide-react';
import './ProfileTabs.scss';

import BlogsGrid from '../Blogs/BlogsGrid';
import ProfileGallery from '../../../features/gallery/components/ProfileGallery';
import SavedItems from '../SavedItems/SavedItems';
import ProfileSafarGrid from '../../../features/safargram/components/ProfileSafarGrid';
import ProfileBucketList from '../../../features/safargram/components/ProfileBucketList';

const SAVED_TABS = [
    { id: 'posts', label: 'Bucket list', icon: Bookmark },
    { id: 'destinations', label: 'Destinations', icon: Navigation }
];

// The tabs under the header: SafarGram posts, blogs, gallery and (only on your own profile) saved.
// (Tours and Achievements are hidden: tours belong to booking, which is switched off, and nothing
// awards achievements yet.)
const ProfileTabs = ({ activeTab, setActiveTab, blogs = [], counts = {}, isOwnProfile, username }) => {
    const [savedTab, setSavedTab] = useState('posts');

    const tabs = [
        { id: 'posts', label: 'SafarGram', icon: Grid, count: counts.posts },
        { id: 'blogs', label: 'Blogs', icon: BookOpen, count: counts.blogs ?? blogs.length },
        { id: 'gallery', label: 'Gallery', icon: Image, count: counts.photos },
        ...(isOwnProfile ? [{ id: 'saved', label: 'Saved', icon: Bookmark }] : [])
    ];

    const content = () => {
        switch (activeTab) {
            case 'posts':
                return <ProfileSafarGrid username={username} />;
            case 'blogs':
                return <BlogsGrid blogs={blogs} isOwnProfile={isOwnProfile} />;
            case 'gallery':
                return <ProfileGallery username={username} isOwnProfile={isOwnProfile} />;
            case 'saved':
                return (
                    <div className="saved-content">
                        <div className="sub-tabs">
                            {SAVED_TABS.map((t) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={`sub-tab-button ${savedTab === t.id ? 'active' : ''}`}
                                    onClick={() => setSavedTab(t.id)}
                                >
                                    <t.icon size={15} /> {t.label}
                                </button>
                            ))}
                        </div>
                        {savedTab === 'posts' ? <ProfileBucketList /> : <SavedItems type="destinations" />}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="profile-tabs">
            <div className="tabs-header" role="tablist">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={17} />
                        <span className="tab-label">{tab.label}</span>
                        {tab.count > 0 && <span className="count">{tab.count}</span>}
                    </button>
                ))}
            </div>

            <div className="tabs-content" role="tabpanel">{content()}</div>
        </div>
    );
};

export default ProfileTabs;
