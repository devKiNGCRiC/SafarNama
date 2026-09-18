import React, { useState, useEffect } from "react";
import "./BlogView.scss";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiEdit,
  FiTrash,
  FiHeart,
  FiShare2,
  FiCalendar,
  FiUser,
  FiClock,
  FiTag,
} from "react-icons/fi";
import { API_URL } from '../../config/api';

// Lazy load AOS
let Aos;
const loadAos = async () => {
  if (!Aos) {
    Aos = (await import("aos")).default;
    await import("aos/dist/aos.css");
  }
  return Aos;
};

const BlogView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);

  // Get userId from multiple possible sources
  const getUserId = () => {
    if (auth?.user?._id) return auth.user._id;
    if (auth?.user?.id) return auth.user.id;
    const directUserId = localStorage.getItem("userId");
    if (directUserId) return directUserId;
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id || user.userId;
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const isOwner = getUserId() === blog?.user?._id;

  // Get blog details
  const getBlogDetail = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/v1/blog/get-blog/${id}`,
      );
      if (data?.success) {
        setBlog(data?.blog);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load blog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getBlogDetail();
    loadAos().then((AosModule) => {
      AosModule.init({
        duration: 1000,
        once: true,
      });
    });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      const { data } = await axios.delete(
        `${API_URL}/api/v1/blog/delete-blog/${id}`,
      );
      if (data?.success) {
        toast.success("Blog deleted successfully!");
        navigate("/myblog");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete blog");
    }
  };

  const handleEdit = () => {
    navigate(`/blog-details/${id}`);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Removed from favorites" : "Added to favorites!");
  };

  const handleShare = () => {
    const blogUrl = window.location.href;
    navigator.clipboard.writeText(blogUrl);
    toast.success("Link copied to clipboard!");
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  };

  if (loading) {
    return (
      <div className="blog-view-loading">
        <div className="loading-spinner"></div>
        <p>Loading your story...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-view-error">
        <div className="error-content">
          <h2>Story Not Found</h2>
          <p>The blog you're looking for doesn't exist or has been removed.</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/blogs")}
          >
            <FiArrowLeft />
            <span>Back to Stories</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-view-page">
      {/* Back Button */}
      <button
        className="back-button-fixed"
        onClick={() => navigate(-1)}
        data-aos="fade-right"
      >
        <FiArrowLeft />
        <span>Back</span>
      </button>

      {/* Hero Section with Image */}
      <section className="blog-view-hero" data-aos="fade-in">
        <div className="hero-image-wrapper">
          <img src={blog.image} alt={blog.title} className="hero-image" />
          <div className="hero-gradient-overlay"></div>
        </div>

        <div className="hero-content-wrapper">
          <div className="hero-content">
            {/* Category Badge */}
            {blog.category && (
              <div className="category-badge" data-aos="fade-down">
                {blog.category}
              </div>
            )}

            {/* Title */}
            <h1 className="blog-title" data-aos="fade-up" data-aos-delay="100">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div
              className="blog-meta-info"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="meta-item">
                <FiUser className="meta-icon" />
                <span>{blog.user?.username || "Anonymous"}</span>
              </div>
              <div className="meta-divider">•</div>
              <div className="meta-item">
                <FiCalendar className="meta-icon" />
                <span>{formatDate(blog.createdAt)}</span>
              </div>
              <div className="meta-divider">•</div>
              <div className="meta-item">
                <FiClock className="meta-icon" />
                <span>{calculateReadTime(blog.description)} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="blog-view-container">
        <div className="blog-content-wrapper">
          {/* Article Content */}
          <article className="blog-article" data-aos="fade-up">
            {/* Excerpt if available */}
            {blog.excerpt && (
              <div className="blog-excerpt">
                <p>{blog.excerpt}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="blog-actions">
              <button
                className={`action-btn ${isLiked ? "liked" : ""}`}
                onClick={handleLike}
                title="Like this story"
              >
                <FiHeart />
                <span>Like</span>
              </button>
              <button
                className="action-btn"
                onClick={handleShare}
                title="Share this story"
              >
                <FiShare2 />
                <span>Share</span>
              </button>

              {isOwner && (
                <>
                  <button
                    className="action-btn edit-btn"
                    onClick={handleEdit}
                    title="Edit blog"
                  >
                    <FiEdit />
                    <span>Edit</span>
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={handleDelete}
                    title="Delete blog"
                  >
                    <FiTrash />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>

            {/* Main Content */}
            <div className="blog-content">
              {blog.description
                .split("\n")
                .map(
                  (paragraph, index) =>
                    paragraph.trim() && <p key={index}>{paragraph}</p>,
                )}
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="blog-tags">
                <FiTag className="tags-icon" />
                <div className="tags-list">
                  {blog.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Author Card Sidebar */}
          <aside className="blog-sidebar" data-aos="fade-left">
            <div className="author-card">
              <h3>About the Author</h3>
              <div className="author-info">
                <div className="author-avatar">
                  {blog.user?.username?.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="author-details">
                  <h4>{blog.user?.username || "Anonymous"}</h4>
                  <p>Travel Enthusiast & Storyteller</p>
                </div>
              </div>
            </div>

            {/* Share Card */}
            <div className="share-card">
              <h3>Share This Story</h3>
              <button className="share-btn" onClick={handleShare}>
                <FiShare2 />
                <span>Copy Link</span>
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogView;
