import React, { useState, useEffect } from "react";
import "./CreateBlog.scss";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FiEdit3,
  FiImage,
  FiFileText,
  FiSave,
  FiX,
  FiInfo,
  FiArrowLeft,
  FiTag,
  FiList,
  FiUpload,
} from "react-icons/fi";
import { API_URL } from '../../config/api';

const CreateBlog = () => {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  // Get userId from multiple possible sources
  const getUserId = () => {
    // 1. Try Redux store first (most reliable)
    if (auth?.user?._id) {
      console.log("Found userId from Redux:", auth.user._id);
      return auth.user._id;
    }
    if (auth?.user?.id) {
      console.log("Found userId from Redux (id):", auth.user.id);
      return auth.user.id;
    }

    // 2. Try direct userId from localStorage
    const directUserId = localStorage.getItem("userId");
    if (directUserId) {
      console.log("Found userId directly from localStorage:", directUserId);
      return directUserId;
    }

    // 3. Try getting from user object in localStorage
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("Parsed user object from localStorage:", user);
        // Try different possible keys for user ID
        const userId = user._id || user.id || user.userId;
        if (userId) {
          console.log("Found userId from user object:", userId);
          return userId;
        }
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
      }
    }

    // 4. Try getting from token
    const token = localStorage.getItem("token");
    if (token) {
      console.log(
        "Token exists but no userId found. Token:",
        token.substring(0, 20) + "...",
      );
    }

    console.error("❌ No user ID found in any location. Auth state:", auth);
    return null;
  };

  const [id, setId] = useState(getUserId());
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
  const [uploadMode, setUploadMode] = useState("file"); // 'file' or 'url'
  const [uploading, setUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

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

  useEffect(() => {
    // Re-check user ID on mount and when auth changes
    const currentUserId = getUserId();
    console.log("useEffect - Current user ID:", currentUserId);
    setId(currentUserId);

    if (!currentUserId) {
      console.warn("⚠️ No user ID found. User needs to sign in.");
      console.log("Auth state:", auth);
      console.log(
        "LocalStorage token:",
        localStorage.getItem("token") ? "exists" : "missing",
      );
      console.log("LocalStorage user:", localStorage.getItem("user"));
    } else {
      console.log("✅ User ID found:", currentUserId);
    }

    // Load draft from localStorage
    const savedDraft = localStorage.getItem("blogDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setInputs({
          title: draft.title || "",
          description: draft.description || "",
          image: draft.image || "",
          excerpt: draft.excerpt || "",
          category: draft.category || "Travel",
          tags: draft.tags || "",
        });
        if (draft.image) {
          setImagePreview(draft.image);
        }
        setLastSaved(draft.savedAt ? new Date(draft.savedAt) : null);
        toast.success(
          "Draft loaded! Continue writing from where you left off.",
        );
      } catch (e) {
        console.error("Failed to load draft:", e);
      }
    }
  }, [auth]);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}:`, value);
    setInputs((prevState) => ({ ...prevState, [name]: value }));

    // Update image preview
    if (name === "image") {
      setImagePreview(value);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Upload image to server
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
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 second timeout
        },
      );

      console.log("Image upload response:", data);

      if (data?.success) {
        return data.imageUrl;
      } else {
        throw new Error(data?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      if (error.response) {
        toast.error(
          `Upload failed: ${error.response.data?.message || "Unknown error"}`,
        );
      } else if (error.code === "ECONNABORTED") {
        toast.error("Upload timeout. Please try with a smaller image.");
      } else {
        toast.error(
          "Failed to upload image. Please check your internet connection.",
        );
      }
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields first
    if (!inputs.title.trim()) {
      toast.error("Please enter a blog title");
      return;
    }

    if (!inputs.description.trim()) {
      toast.error("Please enter blog description");
      return;
    }

    if (!id) {
      toast.error("Please sign in to create a blog");
      return;
    }

    // Validate image based on mode
    if (uploadMode === "file" && !imageFile) {
      toast.error("Please select an image file");
      return;
    }

    if (uploadMode === "url" && !inputs.image.trim()) {
      toast.error("Please provide an image URL");
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

      console.log("Submitting blog with data:", {
        title: inputs.title,
        description: inputs.description,
        image: imageUrl,
        excerpt: inputs.excerpt,
        category: inputs.category,
        tags: tagsArray,
        user: id,
      });

      const { data } = await axios.post(
        `${API_URL}/api/v1/blog/create-blog`,
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

      console.log("Server response:", data);

      if (data?.success) {
        // Clear draft after successful publish
        localStorage.removeItem("blogDraft");
        setLastSaved(null);
        toast.success("Blog Created Successfully!");
        navigate("/myblog");
      } else {
        toast.error(data?.message || "Failed to create blog");
      }
    } catch (error) {
      console.error("Blog creation error:", error);
      if (error.response) {
        toast.error(
          `Server Error: ${error.response.data?.message || "Unknown error"}`,
        );
      } else if (error.request) {
        toast.error(
          "Server not responding. Please make sure the server is running.",
        );
      } else {
        toast.error("Failed to create blog. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    const draft = {
      ...inputs,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("blogDraft", JSON.stringify(draft));
    setLastSaved(new Date());
    toast.success("Draft saved successfully!");
  };

  // Clear form and draft
  const handleClear = () => {
    if (
      window.confirm(
        "Are you sure you want to clear everything? This will also delete any saved draft.",
      )
    ) {
      setInputs({
        title: "",
        description: "",
        image: "",
        excerpt: "",
        category: "Travel",
        tags: "",
      });
      setImagePreview("");
      setImageFile(null);
      localStorage.removeItem("blogDraft");
      setLastSaved(null);
      toast.success("Form cleared!");
    }
  };

  const handleBack = () => {
    navigate("/blogs");
  };

  return (
    <div className="create-blog-page">
      {/* Hero Header Section */}
      <section className="create-hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-badge" data-aos="fade-down">
          <FiEdit3 />
          <span>Share Your Journey</span>
        </div>
        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="100">
          <span className="brand-safar">Create Your</span>{" "}
          <span className="brand-nama">Travel Story</span>
        </h1>
        <p className="hero-subtitle" data-aos="fade-up" data-aos-delay="200">
          Share your adventures and inspire fellow travelers around the world
        </p>
      </section>

      {/* Form Container */}
      <div className="create-blog-container">
        <div className="create-blog-wrapper">
          {/* Back Button */}
          <button
            className="back-button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <FiArrowLeft />
            <span>Back to Blogs</span>
          </button>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="create-blog-form"
            data-aos="fade-up"
          >
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
                placeholder="Enter a captivating title for your blog..."
                className="form-input"
                required
                maxLength={100}
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
                placeholder="Write a brief summary of your blog (shown in preview cards)..."
                className="form-textarea"
                rows={3}
                maxLength={200}
              />
              <span className="char-count">{inputs.excerpt.length}/200</span>
            </div>

            {/* Category Dropdown */}
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
                placeholder="Enter tags separated by commas (e.g., mountains, trekking, himalaya)"
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
                      onClick={() => {
                        const currentTags = inputs.tags
                          ? inputs.tags.split(",").map((t) => t.trim())
                          : [];
                        if (!currentTags.includes(tag)) {
                          const newTags = [...currentTags, tag].join(", ");
                          setInputs({ ...inputs, tags: newTags });
                        }
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload/URL Input */}
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

              {/* File Upload Mode */}
              {uploadMode === "file" && (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleFileChange}
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

              {/* URL Input Mode */}
              {uploadMode === "url" && (
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={inputs.image}
                  onChange={handleChange}
                  placeholder="https://example.com/your-image.jpg"
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
                      setInputs({ ...inputs, image: "" });
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              )}
            </div>

            {/* Description Textarea */}
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
                required
                rows={12}
                maxLength={5000}
              />
              <span className="char-count">
                {inputs.description.length}/5000
              </span>
            </div>

            {/* Writing Tips Card */}
            <div className="tips-card" data-aos="fade-up">
              <div className="tips-header">
                <FiInfo className="tips-icon" />
                <h3>Writing Tips</h3>
              </div>
              <ul className="tips-list">
                <li>Use a catchy title that grabs attention</li>
                <li>Write a clear excerpt to help readers decide</li>
                <li>Choose the right category and add relevant tags</li>
                <li>Share personal experiences and emotions</li>
                <li>Include practical tips for fellow travelers</li>
                <li>Use high-quality images to enhance your story</li>
                <li>Keep paragraphs short and easy to read</li>
              </ul>
            </div>

            {/* Last Saved Info */}
            {lastSaved && (
              <div className="last-saved-info">
                <FiInfo />
                <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleSaveDraft}
                disabled={loading || uploading}
                title="Save your work as draft"
              >
                <FiSave />
                <span>Save Draft</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClear}
                disabled={loading || uploading}
              >
                <FiX />
                <span>Clear</span>
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || uploading || !id}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Uploading Image...</span>
                  </>
                ) : loading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Publishing...</span>
                  </>
                ) : !id ? (
                  <>
                    <FiX />
                    <span>Please Login First</span>
                  </>
                ) : (
                  <>
                    <FiSave />
                    <span>Publish Blog</span>
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

export default CreateBlog;
