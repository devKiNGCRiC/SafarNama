import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './CommunityForum.css';
import { 
  Leaf, 
  Search, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark 
} from 'lucide-react';

// Import actions
import { 
  getForumPosts, 
  likeForumPost, 
  bookmarkForumPost,
  // searchForumPosts
} from '../../Actions/ForumPostAction';

const CommentSection = ({ postId, comments, onAddComment }) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(postId, { text: newComment });
      setNewComment('');
    }
  };

  return (
    <div className="forum-comment-section">
      <div className="forum-existing-comments">
        {comments?.map((comment, index) => (
          <div key={index} className="forum-comment">
            <img 
              src={comment.user?.avatar || '/default-avatar.png'} 
              alt={comment.user?.name || 'Anonymous'}
              className="forum-comment-avatar" 
            />
            <div className="forum-comment-content">
              <h4>{comment.user?.name || 'Anonymous'}</h4>
              <p>{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmitComment} className="forum-add-comment-form">
        <input 
          type="text"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="forum-comment-input"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

const CommunityForum = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('trending');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  
  const { 
    posts = [], 
    loading = false, 
    error = null 
  } = useSelector(state => state.forumPosts || {});

  useEffect(() => {
    dispatch(getForumPosts({ 
      sort: activeTab, 
      search: searchQuery 
    }));
  }, [dispatch, activeTab, searchQuery]);

  const handleSearch = () => {
    dispatch(searchForumPosts(searchQuery));
  };

  const handleCreatePost = () => {
    navigate('/create-forum-post');
  };

  const handleLike = (postId) => {
    dispatch(likeForumPost(postId));
  };

  const handleBookmark = (postId) => {
    dispatch(bookmarkForumPost(postId));
  };

  if (loading) return <div className="forum-loading">Loading...</div>;
  if (error) return <div className="forum-error">Error: {error}</div>;

  return (
    <div className="forum-container">
      {/* Hero Section */}
      <header className="forum-hero">
        <Leaf className="forum-hero-icon" color="#4CAF50" />
        <h1>SafarNama Community</h1>
        <p>Explore, Share, Inspire Sustainable Travel</p>
        <button onClick={handleCreatePost} className="forum-create-post-btn">
          Start a Discussion
        </button>
      </header>

      {/* Search and Filters */}
      <div className="forum-search-filters">
        <div className="forum-search-container">
          <input 
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="forum-search-input"
          />
          <button onClick={handleSearch} className="forum-search-btn">
            <Search />
          </button>
        </div>

        <div className="forum-tabs">
          <button 
            onClick={() => setActiveTab('trending')}
            className={`forum-tab ${activeTab === 'trending' ? 'active' : ''}`}
          >
            Trending
          </button>
          <button 
            onClick={() => setActiveTab('recent')}
            className={`forum-tab ${activeTab === 'recent' ? 'active' : ''}`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Posts Container */}
      <div className="forum-posts-container">
        {posts.map(post => (
          <article key={post._id} className="forum-post-card">
            {/* Post Header */}
            <div className="forum-post-header">
              <img 
                src={post.author?.avatar || '/default-avatar.png'} 
                alt={post.author?.name} 
                className="forum-post-avatar"
              />
              <div className="forum-post-meta">
                <h3>{post.author?.name}</h3>
                <p>{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Post Content */}
            <h2 className="forum-post-title">{post.title}</h2>
            <p className="forum-post-content">{post.content}</p>

            {/* Tags */}
            <div className="forum-post-tags">
              {post.tags?.map(tag => (
                <span key={tag} className="forum-tag">#{tag}</span>
              ))}
            </div>

            {/* Post Actions */}
            <div className="forum-post-actions">
              <div className="forum-interaction-btns">
                <button 
                  onClick={() => handleLike(post._id)}
                  className="forum-action-btn"
                >
                  <Heart /> {post.likes?.length || 0}
                </button>
                <button 
                  onClick={() => setOpenCommentPostId(
                    openCommentPostId === post._id ? null : post._id
                  )}
                  className="forum-action-btn"
                >
                  <MessageCircle /> {post.comments?.length || 0}
                </button>
              </div>
              <div className="forum-share-btns">
                <button className="forum-action-btn">
                  <Share2 />
                </button>
                <button 
                  onClick={() => handleBookmark(post._id)}
                  className="forum-action-btn"
                >
                  <Bookmark />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {openCommentPostId === post._id && (
              <CommentSection 
                postId={post._id}
                comments={post.comments}
                onAddComment={() => {/* Implement comment addition */}}
              />
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default CommunityForum;