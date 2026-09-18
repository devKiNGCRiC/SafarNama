import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  FiMapPin,
  FiStar,
  FiSearch,
  FiFilter,
  FiDollarSign,
  FiClock,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";
import { BiTrendingUp } from "react-icons/bi";
import { TbMountain } from "react-icons/tb";
import "./AllDestination.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { API_URL } from '../../config/api';

const AllDestinations = () => {
  // Destinations state
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);

  // Unique categories and activities
  const categories = [
    "All",
    "Mountain",
    "Nature",
    "Park",
    "Beach",
    "Recommended",
  ];

  // Comprehensive activity list
  const commonActivities = [
    "All Activities",
    "Trekking",
    "Hiking",
    "Rafting",
    "Rock Climbing",
    "Camping",
    "Wildlife Safari",
    "Photography",
    "Bird Watching",
    "Skiing",
    "Paragliding",
    "Scuba Diving",
    "Snorkeling",
    "Kayaking",
    "Mountain Biking",
    "Temple Visit",
    "Cultural Tour",
    "Food Tour",
    "Yoga & Meditation",
  ];

  const difficultyLevels = [
    "All",
    "Easy",
    "Moderate",
    "Challenging",
    "Difficult",
  ];
  const budgetRanges = [
    "All",
    "Budget (₹0-5k)",
    "Mid-Range (₹5k-15k)",
    "Luxury (₹15k+)",
  ];
  const seasons = ["All", "Summer", "Monsoon", "Autumn", "Winter", "Spring"];

  const [availableActivities, setAvailableActivities] = useState([]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/v1/destinations`,
        );
        setDestinations(res.data.data);

        // Extract unique activities
        const activities = [
          ...new Set(
            res.data.data.flatMap((dest) =>
              dest.activities.map((activity) => activity.name),
            ),
          ),
        ];
        setAvailableActivities(activities);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching destinations:", error);
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  // Filtering and Sorting Logic
  useEffect(() => {
    let result = [...destinations];

    // Search Filter
    if (searchTerm) {
      result = result.filter(
        (dest) =>
          dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dest.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (dest.description &&
            dest.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Category Filter - FIX: Handle both string and array
    if (selectedCategory !== "All") {
      result = result.filter((dest) => {
        // Handle if category is a string
        if (typeof dest.category === "string") {
          return dest.category === selectedCategory;
        }
        // Handle if category is an array
        if (Array.isArray(dest.category)) {
          return dest.category.includes(selectedCategory);
        }
        return false;
      });
    }

    // Activity Filter
    if (selectedActivity && selectedActivity !== "All Activities") {
      result = result.filter(
        (dest) =>
          dest.activities &&
          dest.activities.some((activity) =>
            activity.name
              .toLowerCase()
              .includes(selectedActivity.toLowerCase()),
          ),
      );
    }

    // Difficulty Filter
    if (selectedDifficulty && selectedDifficulty !== "All") {
      result = result.filter(
        (dest) =>
          dest.difficulty &&
          dest.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
      );
    }

    // Budget Filter
    if (selectedBudget && selectedBudget !== "All") {
      result = result.filter((dest) => {
        const price = dest.price || 0;
        if (selectedBudget.includes("0-5k")) return price <= 5000;
        if (selectedBudget.includes("5k-15k"))
          return price > 5000 && price <= 15000;
        if (selectedBudget.includes("15k+")) return price > 15000;
        return true;
      });
    }

    // Season Filter
    if (selectedSeason && selectedSeason !== "All") {
      result = result.filter(
        (dest) =>
          dest.bestTimeToVisit &&
          dest.bestTimeToVisit.season &&
          dest.bestTimeToVisit.season
            .toLowerCase()
            .includes(selectedSeason.toLowerCase()),
      );
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "popular":
          return (b.views || b.rating || 0) - (a.views || a.rating || 0);
        case "newest":
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredDestinations(result);
  }, [
    destinations,
    searchTerm,
    selectedCategory,
    selectedActivity,
    selectedDifficulty,
    selectedBudget,
    selectedSeason,
    sortBy,
  ]);

  if (loading)
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Discovering amazing destinations...</p>
      </div>
    );

  const resetAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedActivity("");
    setSelectedDifficulty("");
    setSelectedBudget("");
    setSelectedSeason("");
    setSortBy("popular");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "All" ||
    selectedActivity ||
    selectedDifficulty ||
    selectedBudget ||
    selectedSeason;

  return (
    <>
      <Navbar />
      <div className="all-destinations">
        {/* Hero Header */}
        <div className="destinations-header">
          <div className="hero-badge">
            <span className="badge-icon">🗺️</span>
            <span className="badge-text">Explore India</span>
          </div>

          <h1 className="main-title">
            <span className="discover-text">Discover</span>
            <span className="brand-container">
              <span className="safar">Safar</span>
              <span className="nama">Nama</span>
            </span>
            <span className="destinations-text">Destinations</span>
          </h1>

          <p className="subtitle">
            Handpicked eco-friendly destinations across Incredible India 🇮🇳
          </p>

          {/* Main Search Bar */}
          <div className="main-search-container">
            <div className="search-bar-hero">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder='Search destinations like "Himalayan Trek", "Kerala Backwaters"...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-hero"
              />
              {searchTerm && (
                <button
                  className="clear-btn"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Popular Searches */}
            <div className="popular-searches">
              <span className="label">Popular:</span>
              <button
                onClick={() => setSearchTerm("Manali")}
                className="popular-tag"
              >
                🏔️ Manali
              </button>
              <button
                onClick={() => setSearchTerm("Goa")}
                className="popular-tag"
              >
                🏖️ Goa
              </button>
              <button
                onClick={() => setSearchTerm("Valley of Flowers")}
                className="popular-tag"
              >
                🌸 Valley of Flowers
              </button>
              <button
                onClick={() => setSearchTerm("Rishikesh")}
                className="popular-tag"
              >
                🧘 Rishikesh
              </button>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "All" && "🌏 "}
              {cat === "Recommended" && "⭐ "}
              {cat === "Mountain" && "🏔️ "}
              {cat === "Nature" && "🌿 "}
              {cat === "Park" && "🦁 "}
              {cat === "Beach" && "🏖️ "}
              {cat}
            </button>
          ))}
        </div>

        {/* Advanced Filters Section */}
        <div className="filters-wrapper">
          <div className="filters-header">
            <button
              className="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter className="icon" />
              <span>{showFilters ? "Hide" : "Show"} Advanced Filters</span>
              {hasActiveFilters && <span className="active-indicator"></span>}
            </button>

            <div className="results-sort-row">
              <span className="results-count">
                <TbMountain className="icon" />
                {filteredDestinations.length}{" "}
                {filteredDestinations.length === 1
                  ? "Destination"
                  : "Destinations"}
              </span>

              <div className="sort-dropdown">
                <BiTrendingUp className="sort-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filters-grid">
                {/* Things to Do */}
                <div className="filter-group">
                  <label className="filter-label">
                    <FiTrendingUp className="label-icon" />
                    Things to Do
                  </label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="filter-select-modern"
                  >
                    {commonActivities.map((activity) => (
                      <option
                        key={activity}
                        value={activity === "All Activities" ? "" : activity}
                      >
                        {activity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Level */}
                <div className="filter-group">
                  <label className="filter-label">
                    <TbMountain className="label-icon" />
                    Difficulty Level
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="filter-select-modern"
                  >
                    {difficultyLevels.map((level) => (
                      <option key={level} value={level === "All" ? "" : level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget Range */}
                <div className="filter-group">
                  <label className="filter-label">
                    <FiDollarSign className="label-icon" />
                    Budget Range
                  </label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="filter-select-modern"
                  >
                    {budgetRanges.map((budget) => (
                      <option
                        key={budget}
                        value={budget === "All" ? "" : budget}
                      >
                        {budget}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Best Season */}
                <div className="filter-group">
                  <label className="filter-label">
                    <FiCalendar className="label-icon" />
                    Best Season
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    className="filter-select-modern"
                  >
                    {seasons.map((season) => (
                      <option
                        key={season}
                        value={season === "All" ? "" : season}
                      >
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <button className="reset-all-btn" onClick={resetAllFilters}>
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Destinations Grid */}
        <div className="destinations-container">
          {filteredDestinations.length === 0 ? (
            <div className="no-destinations">
              <span className="no-results-icon">🔍</span>
              <h3>No destinations found</h3>
              <p>Try adjusting your filters or search terms</p>
              <button className="reset-btn" onClick={resetAllFilters}>
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredDestinations.map((dest, index) => (
              <div key={dest._id} className="destination-item">
                <Link
                  to={`/destinations/${dest._id}`}
                  className="destination-link"
                >
                  <div className="image-wrapper">
                    <img src={dest.images[0]} alt={dest.name} loading="lazy" />
                    <div className="image-overlay"></div>

                    <div className="card-info">
                      <div className="text-content">
                        <h3 className="dest-name">{dest.name}</h3>
                        <p className="dest-location">
                          <FiMapPin className="icon" />
                          <span>{dest.address}</span>
                        </p>
                      </div>
                      <div className="rating-badge">
                        <FiStar
                          style={{ display: "inline", marginRight: "4px" }}
                        />
                        {dest.rating?.toFixed(1) || "4.5"}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AllDestinations;
