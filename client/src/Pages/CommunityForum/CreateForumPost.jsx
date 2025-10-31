import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createForumPost } from '../../Actions/ForumPostAction';
import { 
  LeafIcon, 
  ImageIcon, 
  VideoIcon, 
  TagIcon, 
  SendIcon, 
  XIcon 
} from 'lucide-react';
import './CreateForumPost.css';

const CreateForumPost = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Get user info from Redux store or context (placeholder logic)
  //const user = useSelector(state => state.auth.user);
  const { user } = useSelector((state) => state.authReducer.authData) || {};

  const [postData, setPostData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [],
    images: [],
    videos: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Eco Travel',
    'Sustainable Tourism',
    'Wildlife Conservation',
    'Green Living',
    'Cultural Exchange',
    'Adventure Travel'
  ];

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    const maxFiles = type === 'images' ? 8 : 8;
    
    if (files.length + postData[type].length > maxFiles) {
      setError(`Maximum ${maxFiles} ${type} allowed`);
      return;
    }

    const validFiles = files.filter(file => 
      type === 'images' 
        ? file.type.startsWith('image/') 
        : file.type.startsWith('video/')
    );

    setPostData(prev => ({
      ...prev,
      [type]: [...prev[type], ...validFiles]
    }));
  };

  const removeFile = (index, type) => {
    setPostData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !postData.tags.includes(currentTag.trim())) {
      setPostData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setPostData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!postData.title || !postData.content || !postData.category) {
      setError('Please fill all required fields');
      return;
    }

    try {
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('category', postData.category);
      
      // Add tags
      postData.tags.forEach(tag => formData.append('tags', tag));
      
      // Add images
      postData.images.forEach(image => formData.append('images', image));
      
      // Add videos
      postData.videos.forEach(video => formData.append('videos', video));

      // Dispatch create post action
      await dispatch(createForumPost(formData));
      
      // Redirect to community forum
      navigate('/community-forum');
    } catch (error) {
      setError(error.message || 'Failed to create post');
    }
  };

  return (
    <div className="forum-create-post-container">
      <div className="forum-create-post-wrapper">
        <div className="forum-create-post-header">
          <LeafIcon className="forum-header-icon" />
          <h1>Create Your Eco-Story</h1>
          <p>Share your sustainable travel experiences</p>
        </div>

        <form onSubmit={handleSubmit} className="forum-create-post-form">
          {/* User Info */}
          <div className="forum-user-info">
            <img 
              src={user?.avatar || '/default-avatar.png'} 
              alt={user?.name || 'User'} 
              className="forum-user-avatar" 
            />
            <span className="forum-user-name">{user?.name || 'Traveler'}</span>
          </div>

          {/* Title Input */}
          <div className="forum-form-group">
            <input
              type="text"
              placeholder="Title of your travel story"
              value={postData.title}
              onChange={(e) => setPostData(prev => ({...prev, title: e.target.value}))}
              className="forum-input-field"
              required
            />
          </div>

          {/* Content Textarea */}
          <div className="forum-form-group">
            <textarea
              placeholder="Tell us about your eco-friendly adventure..."
              value={postData.content}
              onChange={(e) => setPostData(prev => ({...prev, content: e.target.value}))}
              className="forum-textarea-field"
              required
            />
          </div>

          {/* Category Dropdown */}
          <div className="forum-form-group">
            <select
              value={postData.category}
              onChange={(e) => setPostData(prev => ({...prev, category: e.target.value}))}
              className="forum-select-field"
              required
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Tags Input */}
          <div className="forum-form-group forum-tags-container">
            <div className="forum-tags-input-wrapper">
              <TagIcon className="forum-input-icon" />
              <input
                type="text"
                placeholder="Add tags (Press Enter)"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="forum-input-field"
              />
            </div>
            <div className="forum-tags-list">
              {postData.tags.map(tag => (
                <span key={tag} className="forum-tag">
                  #{tag}
                  <XIcon 
                    onClick={() => removeTag(tag)} 
                    className="forum-tag-remove" 
                  />
                </span>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="forum-file-upload-section">
            <div className="forum-file-upload-buttons">
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="forum-upload-btn"
              >
                <ImageIcon /> Upload Images
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()}
                className="forum-upload-btn"
              >
                <VideoIcon /> Upload Videos
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                accept="image/*,video/*"
                style={{display: 'none'}} 
                onChange={(e) => handleFileChange(e, 'images')}
              />
            </div>

            {/* File Preview */}
            <div className="forum-file-preview">
              {postData.images.map((image, index) => (
                <div key={index} className="forum-preview-item">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Preview ${index}`} 
                  />
                  <XIcon 
                    onClick={() => removeFile(index, 'images')} 
                    className="forum-preview-remove" 
                  />
                </div>
              ))}
              {postData.videos.map((video, index) => (
                <div key={index} className="forum-preview-item">
                  <video 
                    src={URL.createObjectURL(video)} 
                    controls 
                  />
                  <XIcon 
                    onClick={() => removeFile(index, 'videos')} 
                    className="forum-preview-remove" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="forum-error-message">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="forum-submit-btn">
            <SendIcon /> Publish Your Story
          </button>
        </form>

        {/* Eco Message */}
        <div className="forum-eco-message">
          <p>
            Every story shared is a step towards sustainable travel. 
            Your experience can inspire others to explore responsibly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateForumPost;