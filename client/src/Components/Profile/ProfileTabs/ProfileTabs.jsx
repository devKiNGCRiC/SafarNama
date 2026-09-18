import React from 'react';
import { useState } from 'react';
import { Grid, BookOpen, Map, Bookmark, Image, Award, Navigation } from 'lucide-react';
import './ProfileTabs.scss';

// Import grid components
import BlogsGrid from '../Blogs/BlogsGrid';
import ToursGrid from '../Tours/ToursGrid';
import GalleryGrid from '../Gallery/GalleryGrid';
import AchievementsGrid from '../Achievements/AchievementsGrid';
import SavedItems from '../SavedItems/SavedItems';
import ProfileSafarGrid from '../../../features/safargram/components/ProfileSafarGrid';
import ProfileBucketList from '../../../features/safargram/components/ProfileBucketList';
import SavedDestinations from '../SavedDestinations/SavedDestinations';

const ProfileTabs = ({ activeTab, setActiveTab, profile, isOwnProfile, username }) => {
    const [activeSubTab, setActiveSubTab] = useState('posts');

    const tabs = [
        { id: 'posts', label: 'SafarGram', icon: Grid },
        { id: 'blogs', label: 'Blogs', icon: BookOpen },
        { id: 'tours', label: 'Tours', icon: Map },
        { id: 'gallery', label: 'Gallery', icon: Image },
        { id: 'achievements', label: 'Achievements', icon: Award }
    ];

    if (isOwnProfile) {
        // Add saved items with sub-categories
        tabs.push({ 
            id: 'saved', 
            label: 'Saved', 
            icon: Bookmark,
            subTabs: [
                { id: 'posts', label: 'Bucket List', icon: Bookmark },
                { id: 'destinations', label: 'Destinations', icon: Navigation },
               //{ id: 'itineraries', label: 'Itineraries', icon: Map }
            ]
        });
    }

   // const [activeSubTab, setActiveSubTab] = React.useState('posts');

    const renderSavedContent = () => {
        switch (activeSubTab) {
            case 'posts':
                return <ProfileBucketList />;
            case 'destinations':
                return <SavedItems type="destinations" />;
            // case 'itineraries':
            //     return <SavedItems type="itineraries" />;
            default:
                return null;
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'posts':
                return <ProfileSafarGrid username={username} />;
            case 'blogs':
                return <BlogsGrid blogs={profile?.blogs || []} />;
            case 'tours':
                return <ToursGrid tours={profile?.tours || []} />;
            case 'gallery':
                return <GalleryGrid photos={profile?.photos || []} />;
            case 'achievements':
                return <AchievementsGrid achievements={profile?.achievements || []} />;
            case 'saved':
                return (
                    <div className="saved-content">
                        <div className="sub-tabs">
                            {tabs.find(t => t.id === 'saved').subTabs.map(subTab => (
                                <button
                                    key={subTab.id}
                                    className={`sub-tab-button ${activeSubTab === subTab.id ? 'active' : ''}`}
                                    onClick={() => setActiveSubTab(subTab.id)}
                                >
                                    <subTab.icon size={16} />
                                    <span>{subTab.label}</span>
                                </button>
                            ))}
                        </div>
                        {renderSavedContent()}
                    </div>
                );
            default:
                return null;
        }
    };

     // Log the data being received
     console.log('Profile data in tabs:', profile);

    return (
        <div className="profile-tabs">
            <div className="tabs-header">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {React.createElement(tab.icon, { size: 20 })}
                        <span className="tab-label">{tab.label}</span>
                        {tab.id !== 'posts' && profile?.[tab.id]?.length > 0 && (
                            <span className="count">{profile[tab.id].length}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="tabs-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default ProfileTabs;