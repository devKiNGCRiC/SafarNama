import React, { useState, useEffect } from 'react';
import { X, Heart, Send, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './PostInteractionModal.scss';

const PostInteractionModal = ({ post, user, onClose, onLike, onComment, onDelete }) => {
    const [comment, setComment] = useState('');
    const [showLikes, setShowLikes] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;

        try {
            await onComment(post._id, comment);
            setComment('');
            toast.success('Comment added successfully');
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await onDelete(post._id);
                toast.success('Post deleted successfully');
                onClose();
            } catch (error) {
                toast.error('Failed to delete post');
            }
        }
    };

    return (
        <div className="post-modal-overlay" onClick={onClose}>
            <div className="post-modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="post-modal-grid">
                    <div className="post-image">
                        <img src={post.image} alt={post.caption} />
                    </div>

                    <div className="post-details">
                        <div className="post-header">
                            <div className="user-info">
                                <img 
                                    src={post.user.avatar} 
                                    alt={post.user.username} 
                                    className="avatar"
                                />
                                <span className="username">{post.user.username}</span>
                            </div>
                            {post.user._id === user._id && (
                                <div className="post-options">
                                    <button 
                                        className="options-btn"
                                        onClick={() => setShowOptions(!showOptions)}
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                    {showOptions && (
                                        <div className="options-dropdown">
                                            <button onClick={handleDelete}>Delete Post</button>
                                            <button>Edit Post</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="post-content">
                            <p className="caption">{post.caption}</p>
                            <span className="date">
                                {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="post-interactions">
                            <div className="interaction-stats">
                                <button 
                                    className="likes-btn"
                                    onClick={() => setShowLikes(true)}
                                >
                                    {post.likes?.length} likes
                                </button>
                                <span>{post.comments?.length} comments</span>
                            </div>

                            <div className="comment-section">
                                {post.comments?.map(comment => (
                                    <div key={comment._id} className="comment">
                                        <img 
                                            src={comment.user.avatar} 
                                            alt={comment.user.username} 
                                            className="comment-avatar"
                                        />
                                        <div className="comment-content">
                                            <span className="comment-username">
                                                {comment.user.username}
                                            </span>
                                            <p>{comment.text}</p>
                                            <span className="comment-date">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="interaction-actions">
                                <button 
                                    className={`like-btn ${post.isLiked ? 'active' : ''}`}
                                    onClick={() => onLike(post._id)}
                                >
                                    <Heart size={24} />
                                </button>
                            </div>

                            <form className="comment-form" onSubmit={handleSubmitComment}>
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />
                                <button type="submit" disabled={!comment.trim()}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {showLikes && (
                <div className="likes-modal">
                    <div className="likes-content">
                        <div className="likes-header">
                            <h3>Likes</h3>
                            <button onClick={() => setShowLikes(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="likes-list">
                            {post.likes?.map(like => (
                                <div key={like._id} className="like-item">
                                    <img 
                                        src={like.user.avatar} 
                                        alt={like.user.username} 
                                        className="like-avatar"
                                    />
                                    <span className="like-username">
                                        {like.user.username}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostInteractionModal;