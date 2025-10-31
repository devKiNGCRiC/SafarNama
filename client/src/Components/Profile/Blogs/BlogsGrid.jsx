// src/Components/Profile/Blogs/BlogsGrid.jsx
import React from 'react';
import { Eye, Clock, ThumbsUp, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BlogsGrid.scss';

const BlogsGrid = ({ blogs = [] }) => {
    const navigate = useNavigate();

    // Debug log
    console.log('Blogs received in BlogsGrid:', blogs);

    return (
        <div className="blogs-grid">
            {blogs && blogs.length > 0 ? (
                <div className="grid-container">
                    {blogs.map(blog => (
                        <div 
                            key={blog._id} 
                            className="blog-card"
                            onClick={() => navigate(`/blog/${blog._id}`)}
                        >
                            <div className="blog-image">
                                <img 
                                    src={blog.coverImage || '/api/placeholder/300/200'} 
                                    alt={blog.title} 
                                />
                                {blog.category && (
                                    <span className="blog-category">{blog.category}</span>
                                )}
                            </div>
                            <div className="blog-content">
                                <h3>{blog.title}</h3>
                                <p>{blog.excerpt}</p>
                                <div className="blog-meta">
                                    <span><Clock size={14} /> {blog.readTime || '5'} min read</span>
                                    <span><Eye size={14} /> {blog.views || 0}</span>
                                    <span><ThumbsUp size={14} /> {blog.likes?.length || 0}</span>
                                    <span><MessageCircle size={14} /> {blog.comments?.length || 0}</span>
                                </div>
                                <span className="blog-date">
                                    {new Date(blog.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No blogs published yet</p>
                    <small>Your blogs will appear here once you publish them.</small>
                </div>
            )}
        </div>
    );
};

export default BlogsGrid;