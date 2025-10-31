import React, { useState } from 'react';
import { Grid, List, Heart, MessageCircle, Bookmark, Share2, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './ProfilePosts.scss';

const ProfilePosts = ({ posts, isOwnProfile, onLike, onSave }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [filterOpen, setFilterOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // all, photos, blogs, tours

    const handleLike = async (postId) => {
        try {
            await onLike(postId);
        } catch (error) {
            toast.error('Failed to like post');
        }
    };

    const handleSave = async (postId) => {
        try {
            await onSave(postId);
        } catch (error) {
            toast.error('Failed to save post');
        }
    };

    return (
        <div className="profile-posts">
            <div className="posts-header">
                <div className="view-toggles">
                    <button 
                        className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                    >
                        <Grid size={20} />
                    </button>
                    <button 
                        className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        <List size={20} />
                    </button>
                </div>

                <div className="filter-section">
                    <button 
                        className="filter-toggle"
                        onClick={() => setFilterOpen(!filterOpen)}
                    >
                        <Filter size={20} />
                        Filter
                    </button>

                    {filterOpen && (
                        <div className="filter-dropdown">
                            <button 
                                className={filter === 'all' ? 'active' : ''}
                                onClick={() => setFilter('all')}
                            >
                                All Posts
                            </button>
                            <button 
                                className={filter === 'photos' ? 'active' : ''}
                                onClick={() => setFilter('photos')}
                            >
                                Photos
                            </button>
                            <button 
                                className={filter === 'blogs' ? 'active' : ''}
                                onClick={() => setFilter('blogs')}
                            >
                                Blogs
                            </button>
                            <button 
                                className={filter === 'tours' ? 'active' : ''}
                                onClick={() => setFilter('tours')}
                            >
                                Tours
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className={`posts-container ${viewMode}`}>
                {posts.map((post) => (
                    <div key={post._id} className="post-item">
                        {viewMode === 'grid' ? (
                            <div className="post-grid-item">
                                <img src={post.image} alt={post.caption} />
                                <div className="post-overlay">
                                    <div className="post-stats">
                                        <span><Heart size={16} /> {post.likes?.length}</span>
                                        <span><MessageCircle size={16} /> {post.comments?.length}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="post-list-item">
                                <div className="post-image">
                                    <img src={post.image} alt={post.caption} />
                                </div>
                                <div className="post-content">
                                    <div className="post-text">
                                        <h3>{post.title}</h3>
                                        <p>{post.caption}</p>
                                    </div>
                                    <div className="post-meta">
                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        <div className="post-actions">
                                            <button 
                                                className={`action-btn ${post.isLiked ? 'active' : ''}`}
                                                onClick={() => handleLike(post._id)}
                                            >
                                                <Heart size={18} />
                                                <span>{post.likes?.length || 0}</span>
                                            </button>
                                            <button className="action-btn">
                                                <MessageCircle size={18} />
                                                <span>{post.comments?.length || 0}</span>
                                            </button>
                                            {isOwnProfile && (
                                                <button 
                                                    className={`action-btn ${post.isSaved ? 'active' : ''}`}
                                                    onClick={() => handleSave(post._id)}
                                                >
                                                    <Bookmark size={18} />
                                                </button>
                                            )}
                                            <button className="action-btn">
                                                <Share2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {posts.length === 0 && (
                <div className="no-posts">
                    <h3>No posts yet</h3>
                    <p>Posts will appear here once they are shared.</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePosts;