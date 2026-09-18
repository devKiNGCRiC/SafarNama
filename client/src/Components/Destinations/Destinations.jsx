import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiStar, FiMapPin } from "react-icons/fi";
import "./Destinations.scss";
import { API_URL } from '../../config/api';

const Destinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_URL}/api/v1/destinations/featured`,
      );

      if (response.data.success && response.data.data) {
        // Limit to 6 destinations for perfect 3-3 grid layout
        const limitedData = response.data.data.slice(0, 6);
        setDestinations(limitedData);
        setFilteredDestinations(limitedData);
      }
    } catch (err) {
      console.error("Failed to load destinations:", err);
      setDestinations([]);
      setFilteredDestinations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterByCategory = async (category) => {
    setActiveCategory(category);

    if (category === "All") {
      setFilteredDestinations(destinations);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.get(
        `${API_URL}/api/v1/destinations/category/${category}`,
      );

      if (response.data.success && response.data.data) {
        setFilteredDestinations(response.data.data);
      }
    } catch (err) {
      console.error("Failed to filter destinations:", err);
      const filtered = destinations.filter(
        (dest) => dest.category?.toLowerCase() === category.toLowerCase(),
      );
      setFilteredDestinations(filtered);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="destinations-section-homepage">
      <div className="destinations-wrapper">
        <div className="destinations-header">
          <div className="badge-explore">
            <span>🗺️ Explore India</span>
          </div>

          <h2 className="destinations-main-heading">
            Discover <span className="brand-safar">Safar</span>
            <span className="brand-nama">Nama</span> Destinations
          </h2>

          <p className="destinations-subtitle">
            Handpicked eco-friendly destinations across Incredible India 🇮🇳
          </p>
        </div>

        <div className="category-filters">
          <ul>
            {["All", "Recommended", "Mountain", "Nature", "Park", "Beach"].map(
              (category) => (
                <li
                  key={category}
                  className={activeCategory === category ? "active" : ""}
                  onClick={() => filterByCategory(category)}
                >
                  {category === "All" && "🌏 "}
                  {category === "Recommended" && "⭐ "}
                  {category === "Mountain" && "🏔️ "}
                  {category === "Nature" && "🌿 "}
                  {category === "Park" && "🦁 "}
                  {category === "Beach" && "🏖️ "}
                  {category}
                </li>
              ),
            )}
          </ul>
        </div>

        {isLoading && (
          <div className="loading-wrapper">
            <div className="spinner"></div>
            <p>Discovering amazing places...</p>
          </div>
        )}

        {!isLoading && (
          <div className="destinations-grid">
            {filteredDestinations.length > 0 ? (
              filteredDestinations.map((destination) => (
                <div key={destination._id} className="destination-card">
                  <Link to={`/destinations/${destination._id}`}>
                    <div className="card-image">
                      <img
                        src={destination.images?.[0] || "/placeholder.jpg"}
                        alt={destination.name}
                        loading="lazy"
                      />
                      <div className="card-overlay"></div>

                      <div className="card-info">
                        <div className="card-text">
                          <span className="dest-name">{destination.name}</span>
                          <p className="dest-location">
                            <FiMapPin className="icon" />
                            <span>
                              {destination.address || destination.location}
                            </span>
                          </p>
                        </div>
                        <div className="dest-rating">
                          <FiStar
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          {destination.rating || "4.5"}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="no-results-found">
                <span className="icon-search">🔍</span>
                <p>No destinations found in this category</p>
                <button onClick={() => filterByCategory("All")}>
                  Show All Destinations
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Destinations;
