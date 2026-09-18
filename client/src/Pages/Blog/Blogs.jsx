import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import "./Blogs.scss";
import BlogCard from "../../Components/BlogCard/BlogCard";
import { FiSearch, FiEdit, FiBookOpen, FiCalendar } from "react-icons/fi";
import { AiOutlineSwapRight } from "react-icons/ai";
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

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const auth = useSelector((state) => state.auth);

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
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Travel", "Adventure", "Culture", "Food", "Tips"];

  // Initialize AOS
  useEffect(() => {
    loadAos().then((AosModule) => {
      AosModule.init({
        duration: 1000,
        once: true,
      });
    });
  }, []);

  // Get all blogs
  const getAllBlogs = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/v1/blog/all-blog`,
      );
      if (data?.success) {
        setBlogs(data?.blogs);
        setFilteredBlogs(data?.blogs);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllBlogs();
  }, []);

  // Filter blogs by search and category
  useEffect(() => {
    let result = [...blogs];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (blog) =>
          blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((blog) => blog.category === activeCategory);
    }

    setFilteredBlogs(result);
  }, [searchTerm, activeCategory, blogs]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  if (loading) {
    return (
      <div className="blogs-loading-state">
        <div className="loader"></div>
        <p>Loading travel stories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blogs-error-state">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={getAllBlogs} className="btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="blogs-page">
      <section className="blogs-hero-section">
        <div className="section-overlay"></div>
        <div className="blogs-content">
          {/* Hero Badge */}
          <div className="hero-badge" data-aos="fade-down">
            <span>📝 Travel Stories</span>
          </div>

          {/* Hero Title */}
          <h1
            className="blogs-hero-title"
            data-aos="zoom-in"
            data-aos-delay="100"
          >
            <span className="brand-safar">Safar</span>
            <span className="brand-nama">Nama</span> Stories
          </h1>

          <p
            className="blogs-hero-subtitle"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Share your journey, inspire fellow travelers 🌏
          </p>

          {/* Search Bar */}
          <div
            className="blogs-search-container"
            data-aos="fade-up"
            data-aos-delay="300"
          >
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder='Search stories... try "Himalayan trek" or "Kerala cuisine"'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </form>
          </div>

          {/* Quick Actions */}
          <div
            className="blogs-actions"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            <Link to="/create-blog" className="btn btn-primary">
              <FiEdit className="icon" />
              Write Your Story
              <AiOutlineSwapRight className="icon" />
            </Link>
            <Link to="/myblog" className="btn btn-secondary">
              <FiBookOpen className="icon" />
              My Blogs
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="blogs-main-section section">
        <div className="container">
          {/* Category Filters */}
          <div className="category-filters" data-aos="fade-up">
            <ul>
              {categories.map((category) => (
                <li
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>

          {/* Blogs Grid */}
          <div className="blogs-grid" data-aos="fade-up" data-aos-delay="100">
            {filteredBlogs && filteredBlogs.length > 0 ? (
              filteredBlogs.map((blog) => (
                <BlogCard
                  key={blog._id}
                  id={blog._id}
                  isUser={getUserId() === blog.user?._id}
                  title={blog.title}
                  description={blog.description}
                  image={blog.image}
                  username={blog.user?.username || "Anonymous"}
                  time={blog.createdAt}
                  excerpt={blog.excerpt}
                  category={blog.category}
                />
              ))
            ) : (
              <div className="no-blogs-message">
                <FiBookOpen className="empty-icon" />
                <h3>No Stories Found</h3>
                <p>
                  {searchTerm || activeCategory !== "All"
                    ? "Try adjusting your filters or search terms"
                    : "Be the first to share your travel adventure!"}
                </p>
                <Link to="/create-blog" className="btn">
                  <FiEdit className="icon" />
                  Create First Story
                  <AiOutlineSwapRight className="icon" />
                </Link>
              </div>
            )}
          </div>

          {/* View All Link */}
          {filteredBlogs.length > 0 && (
            <div className="blogs-footer" data-aos="fade-up">
              <p className="blogs-count">
                Showing {filteredBlogs.length} of {blogs.length} stories
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Blogs;
