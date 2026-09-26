// src/Components/Profile/Blogs/BlogsGrid.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import './BlogsGrid.scss';

// The person's blogs, newest first. Each blog from the server has: _id, title, excerpt, image,
// category and createdAt.
const BlogsGrid = ({ blogs = [], isOwnProfile = false }) => {
    if (!blogs.length) {
        return (
            <div className="blogs-grid">
                <div className="empty-state">
                    <p>No blogs published yet</p>
                    <small>
                        {isOwnProfile
                            ? <>Share a trip story: <Link to="/create-blog">write your first blog</Link>.</>
                            : 'Blogs will appear here once they are published.'}
                    </small>
                </div>
            </div>
        );
    }

    return (
        <div className="blogs-grid">
            <div className="grid-container">
                {blogs.map((blog) => (
                    <Link key={blog._id} to={`/blog/${blog._id}`} className="blog-card">
                        <div className="blog-image">
                            {blog.image && <img src={blog.image} alt="" loading="lazy" />}
                            {blog.category && <span className="blog-category">{blog.category}</span>}
                        </div>
                        <div className="blog-content">
                            <h3>{blog.title}</h3>
                            {blog.excerpt && <p>{blog.excerpt}</p>}
                            <span className="blog-date">
                                <Clock size={14} />{' '}
                                {new Date(blog.createdAt).toLocaleDateString('en-GB', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BlogsGrid;
