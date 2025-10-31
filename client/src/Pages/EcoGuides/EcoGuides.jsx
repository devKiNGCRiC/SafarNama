// src/Pages/EcoGuides/EcoGuides.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../Components/Navbar/Navbar';
import Footer from '../../Components/Footer/Footer';
import './EcoGuides.css';

const EcoGuides = () => {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredGuides, setFilteredGuides] = useState([]);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/v1/eco-guides');
        setGuides(response.data.data);
        setFilteredGuides(response.data.data);
      } catch (error) {
        console.error('Error fetching guides:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  useEffect(() => {
    const filtered = guides.filter(guide => {
      const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          guide.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || guide.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredGuides(filtered);
  }, [searchQuery, activeCategory, guides]);

  const categories = [
    { id: 'ALL', label: 'All Guides' },
    { id: 'SUSTAINABLE_TIPS', label: 'Sustainable Tips' },
    { id: 'BEST_PRACTICES', label: 'Best Practices' },
    { id: 'LOCAL_GUIDE', label: 'Local Guides' }
  ];

  if (loading) {
    return <div className="loading">Loading guides...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="eco-guides-container">
        <div className="guides-header">
          <h1>Eco-Tourism Guides</h1>
          <p>Discover sustainable travel tips and local insights</p>
        </div>

        <div className="guides-search-filter">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-filters">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="guides-grid">
          {filteredGuides.map(guide => (
            <div key={guide._id} className="guide-card">
              {guide.images?.[0] && (
                <div className="guide-image">
                  <img src={guide.images[0]} alt={guide.title} />
                </div>
              )}
              <div className="guide-content">
                <span className="guide-category">{
                  categories.find(cat => cat.id === guide.category)?.label
                }</span>
                <h2>{guide.title}</h2>
                <p>{guide.content.substring(0, 150)}...</p>
                <div className="guide-meta">
                  <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                  <span>·</span>
                  <span>{guide.likes?.length || 0} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EcoGuides;