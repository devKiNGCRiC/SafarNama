import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import "./MyBlog.scss";
import axios from "axios";
import BlogCard from "../../Components/BlogCard/BlogCard";
import { FiEdit, FiBookOpen, FiPlus, FiGlobe } from "react-icons/fi";
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

const MyBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = useSelector((state) => state.auth);

  // Get userId from multiple possible sources
  const getUserId = () => {
    // 1. Try Redux store first (most reliable)
    if (auth?.user?._id) return auth.user._id;
    if (auth?.user?.id) return auth.user.id;

    // 2. Try direct userId from localStorage
    const directUserId = localStorage.getItem("userId");
    if (directUserId) return directUserId;

    // 3. Try getting from user object in localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id || user.userId;
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }
    return null;
  };

  // Get user Blog
  const getUserBlog = async () => {
    try {
      const id = getUserId();
      const { data } = await axios.get(
        `${API_URL}/api/v1/blog/user-blog/${id}`,
      );
      if (data?.success) {
        setBlogs(data?.userBlog.blogs);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserBlog();
    loadAos().then((AosModule) => {
      AosModule.init({
        duration: 1000,
        once: true,
      });
    });
  }, []);

  if (loading) {
    return (
      <div className="myblog-loading">
        <div className="loading-spinner"></div>
        <p>Loading your blogs...</p>
      </div>
    );
  }

  return (
    <div className="myblog-page">
      {/* Hero Header Section */}
      <section className="myblog-hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-badge" data-aos="fade-down">
          <FiBookOpen />
          <span>Your Stories</span>
        </div>
        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="100">
          <span className="brand-safar">My Travel</span>{" "}
          <span className="brand-nama">Chronicles</span>
        </h1>
        <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
          Manage and share your journey with fellow travelers
        </p>

        {/* Quick Actions */}
        <div className="hero-actions" data-aos="fade-up" data-aos-delay="300">
          <Link to="/blogs" className="hero-btn btn-secondary">
            <FiGlobe />
            <span>Explore All</span>
          </Link>
          <Link to="/create-blog" className="hero-btn btn-primary">
            <FiPlus />
            <span>Write Story</span>
          </Link>
        </div>
      </section>

      {/* Content Container */}
      <div className="myblog-container">
        {/* Stats Card */}
        <div className="stats-section" data-aos="fade-up">
          <div className="stat-card">
            <div className="stat-icon">
              <FiEdit />
            </div>
            <div className="stat-content">
              <h3>{blogs.length}</h3>
              <p>Published Stories</p>
            </div>
          </div>
        </div>

        {/* Blogs Grid */}
        <div className="myblog-content">
          {blogs && blogs.length > 0 ? (
            <div className="blogs-grid">
              {blogs.map((blog) => (
                <div key={blog._id} data-aos="fade-up">
                  <BlogCard
                    id={blog._id}
                    isUser={true}
                    title={blog.title}
                    description={blog.description}
                    image={blog.image}
                    username={blog.user?.username}
                    time={blog.createdAt}
                    excerpt={blog.excerpt}
                    category={blog.category}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="no-blogs-message" data-aos="fade-up">
              <div className="empty-icon-wrapper">
                <FiBookOpen className="empty-icon" />
              </div>
              <h3>No Stories Yet</h3>
              <p>
                You haven't created any travel stories yet. Start sharing your
                adventures with the world!
              </p>
              <Link to="/create-blog" className="btn btn-primary">
                <FiPlus />
                <span>Create Your First Story</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBlog;
