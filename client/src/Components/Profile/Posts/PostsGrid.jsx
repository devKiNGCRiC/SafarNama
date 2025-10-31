// src/Components/Profile/Posts/PostsGrid.jsx
import React from 'react';
import { Heart, MessageCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PostsGrid.scss';

const PostsGrid = ({ posts = [] }) => {
    const navigate = useNavigate();

    // Debug log
    console.log('Posts received in PostsGrid:', posts);

    return (
        <div className="posts-grid">
            {posts && posts.length > 0 ? (
                <div className="grid-container">
                    {posts.map(post => (
                        <div 
                            key={post._id} 
                            className="post-card"
                            onClick={() => navigate(`/post/${post._id}`)}
                        >
                            <div className="post-image">
                                <img 
                                    src={post.image || '/api/placeholder/300/200'} 
                                    alt={post.title} 
                                />
                                <div className="post-overlay">
                                    <div className="post-stats">
                                        <span><Heart size={16} /> {post.likes?.length || 0}</span>
                                        <span><MessageCircle size={16} /> {post.comments?.length || 0}</span>
                                        <span><Eye size={16} /> {post.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="post-info">
                                <h3>{post.title}</h3>
                                <p>{post.excerpt || post.caption}</p>
                                <div className="post-meta">
                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No posts yet</p>
                    <small>Your posts will appear here once you create them.</small>
                </div>
            )}
        </div>
    );
};

export default PostsGrid;