import React from 'react';
import { useState } from 'react';
import { Grid, BookOpen, Bookmark, Image, Navigation } from 'lucide-react';
import './ProfileTabs.scss';

// Import grid components
import BlogsGrid from '../Blogs/BlogsGrid';
import ProfileGallery from '../../../features/gallery/components/ProfileGallery';
import SavedItems from '../SavedItems/SavedItems';
import ProfileSafarGrid from '../../../features/safargram/components/ProfileSafarGrid';
import ProfileBucketList from '../../../features/safargram/components/ProfileBucketList';
import SavedDestinations from '../SavedDestinations/SavedDestinations';

const ProfileTabs = ({ activeTab, setActiveTab, blogs = [], isOwnProfile, username }) => {
    const [activeSubTab, setActiveSubTab] = useState('posts');

    // (Tours and Achievements tabs are hidden: tours belong to booking, which is switched off, and
    // nothing awards achievements yet.)
    const tabs = [
        { id: 'posts', label: 'SafarGram', icon: Grid },
        { id: 'blogs', label: 'Blogs', icon: BookOpen },
        { id: 'gallery', label: 'Gallery', icon: Image }
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
                return <BlogsGrid blogs={blogs} isOwnProfile={isOwnProfile} />;
            case 'gallery':
                return <ProfileGallery username={username} isOwnProfile={isOwnProfile} />;
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
                        {tab.id === 'blogs' && blogs.length > 0 && (
                            <span className="count">{blogs.length}</span>
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