import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiEdit,
  FiTrash,
  FiEye,
  FiCalendar,
  FiUser,
  FiClock,
  FiTag,
} from "react-icons/fi";
import "./BlogCard.scss";
import { API_URL } from '../../config/api';

export default function BlogCard({
  title,
  description,
  image,
  username,
  time,
  id,
  isUser,
  excerpt,
  category,
}) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    navigate(`/blog-details/${id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this blog?")) return;

    try {
      const { data } = await axios.delete(
        `${API_URL}/api/v1/blog/delete-blog/${id}`,
      );
      if (data?.success) {
        toast.success("Blog deleted successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    }
  };

  const handleViewClick = () => {
    navigate(`/blog/${id}`);
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const calculateReadTime = (text) => {
    const wordsPerMinute = 200;
    const words = text?.split(/\s+/).length || 0;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes || 1;
  };

  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  return (
    <article className="blog-card-wrapper" onClick={handleViewClick}>
      <div className="blog-card-content-upper">
        <div className="blog-card-image-container">
          <img
            src={
              imageError
                ? "https://via.placeholder.com/400x250?text=No+Image"
                : image
            }
            alt={title}
            className="blog-card-img"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          <div className="blog-card-overlay"></div>

          {/* Category Badge */}
          {category && (
            <div className="blog-card-category-badge">
              <FiTag className="category-icon" />
              <span>{category}</span>
            </div>
          )}

          {/* User Actions - Only show for owner */}
          {isUser && (
            <div className="blog-card-owner-actions">
              <button
                className="blog-action-icon edit-action"
                onClick={handleEditClick}
                title="Edit Blog"
              >
                <FiEdit />
              </button>
              <button
                className="blog-action-icon delete-action"
                onClick={handleDelete}
                title="Delete Blog"
              >
                <FiTrash />
              </button>
            </div>
          )}

          {/* View Button Overlay */}
          <button className="blog-view-overlay-btn">
            <FiEye />
            <span>Read Story</span>
          </button>
        </div>

        <div className="blog-card-meta-info">
          <div className="blog-meta-item">
            <FiUser className="meta-icon" />
            <span className="meta-text">{username || "Anonymous"}</span>
          </div>
          <div className="blog-meta-item">
            <FiCalendar className="meta-icon" />
            <span className="meta-text">{formatDate(time)}</span>
          </div>
          <div className="blog-meta-item">
            <FiClock className="meta-icon" />
            <span className="meta-text">
              {calculateReadTime(description)} min read
            </span>
          </div>
        </div>
      </div>

      <div className="blog-card-content-lower">
        <h3 className="blog-card-title">{truncateText(title, 60)}</h3>
        <p className="blog-card-description">
          {excerpt
            ? truncateText(excerpt, 120)
            : truncateText(description, 120)}
        </p>
      </div>
    </article>
  );
}
