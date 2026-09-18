import React, { useState, useEffect } from "react";
import "../Blog/CreateBlog.scss";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiImage,
  FiFileText,
  FiSave,
  FiX,
  FiInfo,
  FiTag,
  FiList,
  FiUpload,
  FiEdit3,
} from "react-icons/fi";
import { API_URL } from '../../config/api';
const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState({});
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({
    title: "",
    description: "",
    image: "",
    excerpt: "",
    category: "Travel",
    tags: "",
  });
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadMode, setUploadMode] = useState("url"); // 'file' or 'url'
  const [uploading, setUploading] = useState(false);

  const categories = [
    "Travel",
    "Adventure",
    "Culture",
    "Food",
    "Tips",
    "Nature",
    "Photography",
    "Budget Travel",
  ];

  const popularTags = [
    "travel",
    "adventure",
    "backpacking",
    "solo-travel",
    "budget-travel",
    "luxury-travel",
    "family-trip",
    "honeymoon",
    "wildlife",
    "nature",
    "mountains",
    "beaches",
    "trekking",
    "hiking",
    "camping",
    "roadtrip",
    "food",
    "street-food",
    "local-cuisine",
    "restaurants",
    "culture",
    "heritage",
    "temples",
    "festivals",
    "photography",
    "landscape",
    "sunset",
    "sunrise",
    "cityscape",
    "architecture",
    "tips",
    "guide",
    "itinerary",
    "planning",
    "visa",
    "budget",
    "accommodation",
    "hostels",
    "hotels",
    "flights",
    "transportation",
    "india",
    "international",
    "asia",
    "europe",
    "america",
    "africa",
  ];

  //get blog details
  const getBlogDetail = async () => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/v1/blog/get-blog/${id}`,
      );
      if (data?.success) {
        setBlog(data?.blog);
        setInputs({
          title: data?.blog.title || "",
          description: data?.blog.description || "",
          image: data?.blog.image || "",
          excerpt: data?.blog.excerpt || "",
          category: data?.blog.category || "Travel",
          tags: Array.isArray(data?.blog.tags) ? data.blog.tags.join(", ") : "",
        });
        setImagePreview(data?.blog.image || "");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load blog details");
    }
  };

  useEffect(() => {
    getBlogDetail();
  }, [id]);

  //input change handler
  const handleChange = (e) => {
    setInputs((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      console.log("Uploading image:", imageFile.name, "Size:", imageFile.size);

      const { data } = await axios.post(
        `${API_URL}/api/v1/blog/upload-blog-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        },
      );

      console.log("Image upload response:", data);

      if (data?.success) {
        return data.imageUrl;
      }
      return null;
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Add tag from suggestions
  const handleTagClick = (tag) => {
    const currentTags = inputs.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    if (!currentTags.includes(tag)) {
      const newTags = currentTags.length > 0 ? `${inputs.tags}, ${tag}` : tag;
      setInputs((prev) => ({ ...prev, tags: newTags }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!inputs.title.trim() || !inputs.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = inputs.image;

      // Upload file if in file mode and file is selected
      if (uploadMode === "file" && imageFile) {
        const uploadToast = toast.loading("Uploading image...");
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          toast.dismiss(uploadToast);
          toast.error("Image upload failed. Please try again.");
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
        toast.dismiss(uploadToast);
        toast.success("Image uploaded successfully!");
      }

      // Process tags into array
      const tagsArray = inputs.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { data } = await axios.put(
        `${API_URL}/api/v1/blog/update-blog/${id}`,
        {
          title: inputs.title,
          description: inputs.description,
          image: imageUrl,
          excerpt: inputs.excerpt,
          category: inputs.category,
          tags: tagsArray,
          user: id,
        },
      );

      if (data?.success) {
        toast.success("Blog Updated Successfully!");
        navigate("/myblog");
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to update blog");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="create-blog-page">
      {/* Hero Header Section */}
      <section className="create-hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-badge">
          <FiFileText />
          <span>Update Your Story</span>
        </div>
        <h1 className="hero-title">
          <span className="brand-safar">Edit Your</span>{" "}
          <span className="brand-nama">Travel Story</span>
        </h1>
        <p className="hero-subtitle">
          Update your blog with enhanced details and share your adventures
        </p>
      </section>

      {/* Form Container */}
      <div className="create-blog-container">
        <div className="create-blog-wrapper">
          {/* Back Button */}
          <button
            className="back-button"
            onClick={() => navigate("/myblog")}
            aria-label="Go back"
          >
            <FiArrowLeft />
            <span>Back to My Blogs</span>
          </button>

          {/* Form */}
          <form onSubmit={handleSubmit} className="create-blog-form">
            {/* Title Input */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                <FiFileText className="label-icon" />
                Blog Title
                <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={inputs.title}
                onChange={handleChange}
                placeholder="Enter an engaging title for your blog..."
                className="form-input"
                maxLength={100}
                required
              />
              <span className="char-count">{inputs.title.length}/100</span>
            </div>

            {/* Excerpt Input */}
            <div className="form-group">
              <label htmlFor="excerpt" className="form-label">
                <FiFileText className="label-icon" />
                Short Description (Excerpt)
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={inputs.excerpt}
                onChange={handleChange}
                placeholder="Write a brief summary (optional)..."
                className="form-input form-textarea excerpt-textarea"
                rows={3}
                maxLength={200}
              />
              <span className="char-count">{inputs.excerpt.length}/200</span>
            </div>

            {/* Category Selection */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">
                <FiList className="label-icon" />
                Category
                <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={inputs.category}
                onChange={handleChange}
                className="form-input"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div className="form-group">
              <label htmlFor="tags" className="form-label">
                <FiTag className="label-icon" />
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={inputs.tags}
                onChange={handleChange}
                placeholder="Enter tags separated by commas (e.g., travel, adventure, mountains)"
                className="form-input"
                maxLength={200}
              />
              <small className="field-hint">
                Separate tags with commas. Max 10 tags.
              </small>

              {/* Popular Tags */}
              <div className="popular-tags">
                <span className="tags-label">Popular tags:</span>
                <div className="tags-grid">
                  {popularTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="tag-suggestion"
                      onClick={() => handleTagClick(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="form-group">
              <label className="form-label">
                <FiImage className="label-icon" />
                Cover Image
                <span className="required">*</span>
              </label>

              {/* Upload Mode Tabs */}
              <div className="upload-mode-tabs">
                <button
                  type="button"
                  className={`tab ${uploadMode === "file" ? "active" : ""}`}
                  onClick={() => setUploadMode("file")}
                >
                  <FiUpload />
                  Upload Image
                </button>
                <button
                  type="button"
                  className={`tab ${uploadMode === "url" ? "active" : ""}`}
                  onClick={() => setUploadMode("url")}
                >
                  <FiImage />
                  Image URL
                </button>
              </div>

              {/* File Upload */}
              {uploadMode === "file" && (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input"
                  />
                  <label htmlFor="imageFile" className="file-upload-label">
                    <FiUpload className="upload-icon" />
                    <span className="upload-text">
                      {imageFile
                        ? imageFile.name
                        : "Click to browse or drag and drop"}
                    </span>
                    <span className="upload-hint">
                      JPG, PNG or JPEG (Max 5MB)
                    </span>
                  </label>
                </div>
              )}

              {/* URL Input */}
              {uploadMode === "url" && (
                <input
                  type="url"
                  name="image"
                  value={inputs.image}
                  onChange={(e) => {
                    handleChange(e);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="form-input"
                  required={uploadMode === "url"}
                />
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    onError={(e) => {
                      e.target.style.display = "none";
                      toast.error("Invalid image");
                    }}
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                      setInputs((prev) => ({ ...prev, image: "" }));
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>

            {/* Description Input */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">
                <FiEdit3 className="label-icon" />
                Your Story
                <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={inputs.description}
                onChange={handleChange}
                placeholder="Share your experiences, tips, and memorable moments from your journey..."
                className="form-textarea"
                rows={12}
                maxLength={5000}
                required
              />
              <span className="char-count">
                {inputs.description.length}/5000
              </span>
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/myblog")}
                disabled={loading || uploading}
              >
                <FiX />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Uploading Image...</span>
                  </>
                ) : loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Update Blog</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogDetails;
