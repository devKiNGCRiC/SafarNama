import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DestinationDetail.scss';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Footer from '../../Components/Footer/Footer';
import Loader from '../../Components/Loader/Loader';
import Aos from 'aos';
import 'aos/dist/aos.css';

// Importing Icons
import { 
  FiMapPin, FiCalendar, FiClock, FiUsers, FiTrendingUp,
  FiAward, FiHeart, FiShare2, FiBookmark, FiChevronDown,
  FiSun, FiCloud, FiDroplet, FiWind, FiAlertCircle,
  FiStar, FiCamera
} from 'react-icons/fi';
import { 
  MdRestaurant, MdDirectionsBike, MdLocalActivity, 
  MdEco, MdSecurity, MdLocalHospital, MdPeople,
  MdEventAvailable, MdAccessible, MdFlight, MdTrain,
  MdDirectionsBus, MdLocalTaxi, MdHotel
} from 'react-icons/md';
import { 
  GiMountainClimbing, GiHiking, GiCampingTent, 
  GiForestCamp, GiMeditation, GiMoneyStack
} from 'react-icons/gi';
import { BiRupee } from 'react-icons/bi';
import { AiOutlineSwapRight } from 'react-icons/ai';
import { API_URL } from '../../config/api';

// Configure Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Hero Section Component
const HeroSection = ({ destination }) => {
  const [isSaved, setIsSaved] = useState(false);
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: destination.name,
        text: destination.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to save destinations');
        return;
      }

      await axios.post(
        `${API_URL}/api/v1/users/saved-destinations/${destination._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSaved(true);
      alert('Destination saved successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving destination');
    }
  };

  return (
    <div className="hero-section">
      <div className="hero-image-container">
        <img 
          src={destination.images?.[0] || '/placeholder.jpg'} 
          alt={destination.name}
          className="hero-image"
        />
        <div className="hero-overlay"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-breadcrumb" data-aos="fade-down">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/destinations">Destinations</Link>
          <span>/</span>
          <span>{destination.name}</span>
        </div>

        <h1 className="hero-title" data-aos="fade-up" data-aos-delay="100">
          {destination.name}
        </h1>

        <div className="hero-location" data-aos="fade-up" data-aos-delay="200">
          <FiMapPin />
          <span>{destination.address}</span>
        </div>

        {/* Rating & Category */}
        {(destination.rating || (destination.category && destination.category.length > 0)) && (
          <div className="hero-meta" data-aos="fade-up" data-aos-delay="250">
            {destination.rating && (
              <div className="rating-display">
                {[...Array(5)].map((_, i) => (
                  i < Math.floor(destination.rating) ? 
                    <FiStar key={i} className="star filled" /> : 
                    <FiStar key={i} className="star empty" />
                ))}
                <span className="rating-text">{destination.rating.toFixed(1)}</span>
                {destination.reviews && destination.reviews.length > 0 && (
                  <span className="review-count">({destination.reviews.length} reviews)</span>
                )}
              </div>
            )}
            
            {destination.category && destination.category.length > 0 && (
              <div className="category-tags">
                {destination.category.map((cat, index) => (
                  <span key={index} className="category-tag">{cat}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="hero-actions" data-aos="fade-up" data-aos-delay="300">
          <button onClick={handleSave} className={`action-btn ${isSaved ? 'saved' : ''}`}>
            <FiBookmark />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button onClick={handleShare} className="action-btn">
            <FiShare2 />
            Share
          </button>
          <Link to={`/safargram/destination/${destination._id}`} className="action-btn">
            <FiCamera />
            Traveller posts
          </Link>
        </div>

        <div className="scroll-indicator" data-aos="fade-up" data-aos-delay="400">
          <FiChevronDown />
          <span>Scroll to explore</span>
        </div>
      </div>
    </div>
  );
};

// Quick Info Cards Component
const QuickInfoSection = ({ destination }) => {
  // Build quick stats from actual model data  
  const quickStats = [
    { 
      icon: <FiCalendar />, 
      label: 'Best Season', 
      value: destination.bestTimeToVisit?.season || destination.seasonality?.peakSeason?.months?.slice(0, 2).join(', ') || 'All Year' 
    },
    { 
      icon: <FiUsers />, 
      label: 'Popularity', 
      value: destination.stats?.popularityScore ? `${destination.stats.popularityScore}/10` : destination.featured ? 'Popular' : 'Moderate' 
    },
    { 
      icon: <BiRupee />, 
      label: 'Entry Fee', 
      value: destination.pricing?.entryFee || (destination.permits && destination.permits.length > 0 ? 'Permit Required' : 'Free Entry')
    },
    { 
      icon: <FiClock />, 
      label: 'Duration', 
      value: destination.stats?.averageStayDuration || '2-4 hours' 
    },
    {
      icon: <FiSun />,
      label: 'Climate',
      value: destination.weather?.climate || 'Pleasant'
    },
    {
      icon: <MdAccessible />,
      label: 'Accessibility',
      value: destination.accessibility?.wheelchairAccessible ? 'Wheelchair Accessible' : destination.accessibility?.publicTransport ? 'Public Transport' : 'Limited Access'
    }
  ];

  return (
    <section className="quick-info-section">
      <div className="container">
        <div className="quick-info-grid">
          {quickStats.map((stat, index) => (
            <div 
              key={index} 
              className="info-card"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="info-icon">{stat.icon}</div>
              <div className="info-content">
                <span className="info-label">{stat.label}</span>
                <span className="info-value">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// About Section Component
const AboutSection = ({ destination }) => {
  return (
    <section className="about-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Discover</span> The Essence
          </h2>
          <p className="section-subtitle">Uncover the story behind this magnificent destination</p>
        </div>

        <div className="about-grid">
          <div className="about-card" data-aos="fade-right">
            <div className="about-icon">📖</div>
            <h3>About</h3>
            <p>{destination.description}</p>
          </div>

          {destination.history && (
            <div className="about-card" data-aos="fade-up">
              <div className="about-icon">🏛️</div>
              <h3>History</h3>
              <p>{destination.history}</p>
            </div>
          )}

          {destination.significance && (
            <div className="about-card" data-aos="fade-left">
              <div className="about-icon">⭐</div>
              <h3>Significance</h3>
              <p>{destination.significance}</p>
            </div>
          )}
        </div>

        {destination.images && destination.images.length > 1 && (
          <div className="destination-gallery" data-aos="fade-up">
            <div className="gallery-grid">
              {destination.images.slice(1, 4).map((image, index) => (
                <div key={index} className="gallery-item">
                  <img src={image} alt={`${destination.name} ${index + 1}`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Activities Section Component
const ActivitiesSection = ({ destination }) => {
  if (!destination.activities || destination.activities.length === 0) return null;

  return (
    <section className="activities-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Activities</span> & Adventures
          </h2>
          <p className="section-subtitle">Thrilling experiences await you</p>
        </div>

        <div className="activities-grid">
          {destination.activities.map((activity, index) => (
            <div 
              key={index} 
              className="activity-card"
              data-aos="zoom-in"
              data-aos-delay={index * 100}
            >
              <div className="activity-image">
                <img src={activity.image} alt={activity.name} />
                <div className="activity-overlay">
                  <MdLocalActivity className="activity-icon" />
                </div>
              </div>
              <div className="activity-content">
                <h3>{activity.name}</h3>
                <p>{activity.description}</p>
                <div className="activity-duration">
                  <FiClock />
                  <span>{activity.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Cuisine Section Component
const CuisineSection = ({ destination }) => {
  if (!destination.cuisine || destination.cuisine.length === 0) return null;

  return (
    <section className="cuisine-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Local</span> Cuisine
          </h2>
          <p className="section-subtitle">Savor the authentic flavors</p>
        </div>

        <div className="cuisine-grid">
          {destination.cuisine.map((item, index) => (
            <div 
              key={index} 
              className="cuisine-card"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="cuisine-image">
                <img src={item.image} alt={item.name} />
                <div className="cuisine-badge">
                  <MdRestaurant />
                </div>
              </div>
              <div className="cuisine-content">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Tabbed Information Section Component
const TabbedInfoSection = ({ destination }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiMapPin /> },
    { id: 'sustainability', label: 'Eco-Friendly', icon: <MdEco /> },
    { id: 'seasonal', label: 'Season & Weather', icon: <FiSun /> },
    { id: 'community', label: 'Local Community', icon: <MdPeople /> }
  ];

  return (
    <section className="tabbed-info-section">
      <div className="container">
        <div className="tabs-navigation" data-aos="fade-up">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && <OverviewTab destination={destination} />}
          {activeTab === 'sustainability' && <SustainabilityTab destination={destination} />}
          {activeTab === 'seasonal' && <SeasonalTab destination={destination} />}
          {activeTab === 'community' && <CommunityTab destination={destination} />}
        </div>
      </div>
    </section>
  );
};

// Overview Tab
const OverviewTab = ({ destination }) => {
  return (
    <div className="overview-tab" data-aos="fade-in">
      <div className="overview-grid">
        <div className="overview-card">
          <div className="card-icon"><FiClock /></div>
          <h3>Visit Timing</h3>
          <div className="overview-details">
            <p><strong>Average Stay:</strong> {destination.stats?.averageStayDuration || 'Not specified'}</p>
            <p><strong>Peak Hours:</strong> {destination.stats?.peakHours?.join(', ') || 'Not specified'}</p>
            <p><strong>Quiet Hours:</strong> {destination.stats?.quietHours?.join(', ') || 'Not specified'}</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon"><MdAccessible /></div>
          <h3>Accessibility</h3>
          <div className="overview-details">
            <p><strong>Wheelchair:</strong> {destination.accessibility?.wheelchairAccessible ? '✓ Yes' : '✗ No'}</p>
            <p><strong>Public Transport:</strong> {destination.accessibility?.publicTransport ? '✓ Available' : '✗ Not Available'}</p>
            <p><strong>Parking:</strong> {destination.accessibility?.parkingAvailable ? '✓ Available' : '✗ Not Available'}</p>
          </div>
        </div>

        {destination.permits && destination.permits.length > 0 && (
          <div className="overview-card permits-card">
            <div className="card-icon"><FiAward /></div>
            <h3>Required Permits</h3>
            <div className="permits-list">
              {destination.permits.map((permit, index) => (
                <div key={index} className="permit-item">
                  <h4>{permit.name}</h4>
                  <p className="permit-cost">Cost: {permit.cost}</p>
                  <p className="permit-validity">Valid: {permit.validityPeriod}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sustainability Tab
const SustainabilityTab = ({ destination }) => {
  if (!destination.sustainabilityInitiatives || destination.sustainabilityInitiatives.length === 0) {
    return (
      <div className="tab-empty" data-aos="fade-in">
        <MdEco />
        <p>No sustainability information available</p>
      </div>
    );
  }

  return (
    <div className="sustainability-tab" data-aos="fade-in">
      <div className="initiatives-grid">
        {destination.sustainabilityInitiatives.map((initiative, index) => (
          <div key={index} className="initiative-card">
            <div className="initiative-header">
              <div className="eco-badge">
                <MdEco />
              </div>
              <h3>{initiative.name}</h3>
            </div>
            <p className="initiative-description">{initiative.description}</p>
            <div className="initiative-impact">
              <strong>Impact:</strong> {initiative.impact}
            </div>
            <div className="participation-guide">
              <h4>How to Participate:</h4>
              <p>{initiative.howToParticipate}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Seasonal Tab
const SeasonalTab = ({ destination }) => {
  if (!destination.seasonality) {
    return (
      <div className="tab-empty" data-aos="fade-in">
        <FiSun />
        <p>No seasonal information available</p>
      </div>
    );
  }

  return (
    <div className="seasonal-tab" data-aos="fade-in">
      <div className="season-grid">
        <div className="season-card peak">
          <div className="season-header">
            <FiSun className="season-icon" />
            <h3>Peak Season</h3>
          </div>
          <div className="season-details">
            <p><strong>Months:</strong> {destination.seasonality.peakSeason?.months?.join(', ')}</p>
            <p><strong>Pricing:</strong> {destination.seasonality.peakSeason?.pricing}</p>
            <div className="season-advantages">
              <h4>Advantages:</h4>
              <ul>
                {destination.seasonality.peakSeason?.advantages?.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="season-card off">
          <div className="season-header">
            <FiCloud className="season-icon" />
            <h3>Off Season</h3>
          </div>
          <div className="season-details">
            <p><strong>Months:</strong> {destination.seasonality.offSeason?.months?.join(', ')}</p>
            <p><strong>Pricing:</strong> {destination.seasonality.offSeason?.pricing}</p>
            <div className="season-advantages">
              <h4>Advantages:</h4>
              <ul>
                {destination.seasonality.offSeason?.advantages?.map((adv, i) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {destination.weather && (
        <div className="weather-section">
          <h3>Weather Information</h3>
          <div className="weather-grid">
            {Object.entries(destination.weather.averageTemperature || {}).map(([season, temp]) => (
              <div key={season} className="weather-card">
                <div className="weather-icon">
                  {season.toLowerCase().includes('summer') && <FiSun />}
                  {season.toLowerCase().includes('winter') && <FiWind />}
                  {season.toLowerCase().includes('monsoon') && <FiDroplet />}
                  {season.toLowerCase().includes('spring') && <FiCloud />}
                </div>
                <h4>{season}</h4>
                <p>{temp}</p>
              </div>
            ))}
          </div>
          <div className="weather-details">
            <p><strong>Climate:</strong> {destination.weather.climate}</p>
            <p><strong>Rainfall Pattern:</strong> {destination.weather.rainfallPattern}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Community Tab
const CommunityTab = ({ destination }) => {
  if (!destination.localCommunity) {
    return (
      <div className="tab-empty" data-aos="fade-in">
        <MdPeople />
        <p>No community information available</p>
      </div>
    );
  }

  return (
    <div className="community-tab" data-aos="fade-in">
      {destination.localCommunity.traditions && destination.localCommunity.traditions.length > 0 && (
        <div className="traditions-section">
          <h3>Local Traditions</h3>
          <div className="traditions-grid">
            {destination.localCommunity.traditions.map((tradition, index) => (
              <div key={index} className="tradition-card">
                <div className="tradition-icon">🎭</div>
                <p>{tradition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {destination.localCommunity.localBusinesses && destination.localCommunity.localBusinesses.length > 0 && (
        <div className="businesses-section">
          <h3>Local Businesses</h3>
          <div className="business-grid">
            {destination.localCommunity.localBusinesses.map((business, index) => (
              <div key={index} className="business-card">
                <div className="business-header">
                  <h4>{business.name}</h4>
                  {business.sustainable && (
                    <span className="eco-badge">
                      <MdEco /> Eco-Friendly
                    </span>
                  )}
                </div>
                <p className="business-type">{business.type}</p>
                <p className="business-description">{business.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Health & Safety Section
const HealthSafetySection = ({ destination }) => {
  if (!destination.healthSafety) return null;

  return (
    <section className="health-safety-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Health</span> & Safety
          </h2>
          <p className="section-subtitle">Your well-being is our priority</p>
        </div>

        <div className="safety-grid">
          <div className="safety-card guidelines" data-aos="fade-right">
            <div className="safety-icon">
              <MdSecurity />
            </div>
            <h3>Safety Guidelines</h3>
            <ul className="guidelines-list">
              {destination.healthSafety.guidelines?.map((guideline, index) => (
                <li key={index}>{guideline}</li>
              ))}
            </ul>
          </div>

          <div className="safety-card emergency" data-aos="fade-left">
            <div className="safety-icon">
              <MdLocalHospital />
            </div>
            <h3>Emergency Contacts</h3>
            <div className="contacts-list">
              {destination.healthSafety.emergencyContacts?.map((contact, index) => (
                <div key={index} className="contact-item">
                  <h4>{contact.name}</h4>
                  <p className="contact-type">{contact.type}</p>
                  <a href={`tel:${contact.number}`} className="contact-number">
                    {contact.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Travel Gear Section
const TravelGearSection = ({ destination }) => {
  if (!destination.travelGear || destination.travelGear.length === 0) return null;

  return (
    <section className="travel-gear-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Essential</span> Travel Gear
          </h2>
          <p className="section-subtitle">Pack smart for your journey</p>
        </div>

        <div className="gear-categories">
          {destination.travelGear.map((category, index) => (
            <div 
              key={index} 
              className="gear-category"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <h3 className="category-title">
                <GiCampingTent />
                {category.category}
              </h3>
              <div className="gear-items">
                {category.items?.map((item, idx) => (
                  <div key={idx} className="gear-item">
                    <div className="gear-header">
                      <h4>{item.name}</h4>
                      <span className={`importance-tag ${item.importance?.toLowerCase()}`}>
                        {item.importance}
                      </span>
                    </div>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Educational Resources Section
const EducationalSection = ({ destination }) => {
  if (!destination.educationalResources || destination.educationalResources.length === 0) return null;

  return (
    <section className="educational-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Learn</span> More
          </h2>
          <p className="section-subtitle">Educational resources and guides</p>
        </div>

        <div className="resources-grid">
          {destination.educationalResources.map((resource, index) => (
            <div 
              key={index} 
              className="resource-card"
              data-aos="zoom-in"
              data-aos-delay={index * 100}
            >
              <div className="resource-header">
                <div className="resource-icon">📚</div>
                <span className="resource-type">{resource.type}</span>
              </div>
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
              {resource.link && (
                <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                  Learn More <AiOutlineSwapRight />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Map Section
const MapSection = ({ destination }) => {
  if (!destination.location?.coordinates || destination.location.coordinates.length !== 2) return null;

  const mapPosition = [destination.location.coordinates[1], destination.location.coordinates[0]];

  return (
    <section className="map-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Location</span> Map
          </h2>
          <p className="section-subtitle">Find us on the map</p>
        </div>

        <div className="map-container" data-aos="fade-up">
          <MapContainer 
            center={mapPosition}
            zoom={13} 
            className="leaflet-map"
            style={{ height: '500px', width: '100%', borderRadius: '20px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={mapPosition}>
              <Popup>{destination.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </section>
  );
};

// Booking CTA Section
const BookingCTASection = ({ destination }) => {
  return (
    <section className="booking-cta-section">
      <div className="container">
        <div className="cta-card" data-aos="zoom-in">
          <div className="cta-content">
            <h2>Ready to Experience {destination.name}?</h2>
            <p>Book your eco-friendly tour now and create unforgettable memories!</p>
            <Link 
              to="/booking" 
              state={{ destinationId: destination._id }}
              className="cta-button"
            >
              View Available Tours
              <AiOutlineSwapRight />
            </Link>
          </div>
          <div className="cta-features">
            <div className="feature">
              <FiAward />
              <span>Best Price Guarantee</span>
            </div>
            <div className="feature">
              <MdEco />
              <span>Eco-Friendly Tours</span>
            </div>
            <div className="feature">
              <MdSecurity />
              <span>Safe & Secure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ====================================
// NEW: WEATHER & CLIMATE DETAILED SECTION
// ====================================
const WeatherClimateSection = ({ destination }) => {
  if (!destination.weather) return null;

  return (
    <section className="weather-climate-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Weather</span> & Climate
          </h2>
          <p className="section-subtitle">Know before you go</p>
        </div>

        <div className="weather-grid">
          {destination.weather.climate && (
            <div className="weather-card" data-aos="fade-up">
              <FiCloud className="weather-icon" />
              <h3>Climate Type</h3>
              <p>{destination.weather.climate}</p>
            </div>
          )}

          {destination.weather.averageTemperature && (
            <div className="temperature-grid">
              {destination.weather.averageTemperature.summer && (
                <div className="temp-card" data-aos="fade-up" data-aos-delay="100">
                  <FiSun />
                  <h4>Summer</h4>
                  <p>{destination.weather.averageTemperature.summer}</p>
                </div>
              )}
              {destination.weather.averageTemperature.winter && (
                <div className="temp-card" data-aos="fade-up" data-aos-delay="150">
                  <FiCloud />
                  <h4>Winter</h4>
                  <p>{destination.weather.averageTemperature.winter}</p>
                </div>
              )}
              {destination.weather.averageTemperature.spring && (
                <div className="temp-card" data-aos="fade-up" data-aos-delay="200">
                  <FiSun />
                  <h4>Spring</h4>
                  <p>{destination.weather.averageTemperature.spring}</p>
                </div>
              )}
              {destination.weather.averageTemperature.fall && (
                <div className="temp-card" data-aos="fade-up" data-aos-delay="250">
                  <FiDroplet />
                  <h4>Fall</h4>
                  <p>{destination.weather.averageTemperature.fall}</p>
                </div>
              )}
            </div>
          )}

          {destination.weather.rainfallPattern && (
            <div className="weather-card" data-aos="fade-up" data-aos-delay="300">
              <FiDroplet className="weather-icon" />
              <h3>Rainfall Pattern</h3>
              <p>{destination.weather.rainfallPattern}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

// ====================================
// NEW: GETTING THERE (TRANSPORTATION) SECTION
// ====================================
const TransportationSection = ({ destination }) => {
  return (
    <section className="transportation-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Getting</span> There
          </h2>
          <p className="section-subtitle">How to reach {destination.name}</p>
        </div>

        <div className="transport-grid">
          <div className="transport-card" data-aos="fade-right">
            <MdFlight className="transport-icon" />
            <h3>By Air</h3>
            <p>Nearest airport with connecting flights andtaxis available.</p>
            <span className="transport-distance">From airport: ~45 km</span>
          </div>

          <div className="transport-card" data-aos="fade-right" data-aos-delay="100">
            <MdTrain className="transport-icon" />
            <h3>By Train</h3>
            <p>Regular trains from major cities. Station nearby with good connectivity.</p>
            <span className="transport-distance">From station: ~12 km</span>
          </div>

          <div className="transport-card" data-aos="fade-right" data-aos-delay="200">
            <MdDirectionsBus className="transport-icon" />
            <h3>By Bus</h3>
            <p>State and private buses operate from various cities.</p>
            <span className="transport-distance">Direct buses available</span>
          </div>

          <div className="transport-card" data-aos="fade-right" data-aos-delay="300">
            <MdLocalTaxi className="transport-icon" />
            <h3>By Car/Taxi</h3>
            <p>Well-connected by road. Cab services and rentals available.</p>
            <span className="transport-distance">Drive time: 2-3 hours</span>
          </div>
        </div>
      </div>
    </section>
  );
};

// ====================================
// NEW: BUDGET PLANNING SECTION
// ====================================
const BudgetPlanningSection = ({ destination }) => {
  return (
    <section className="budget-planning-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Budget</span> Planning
          </h2>
          <p className="section-subtitle">Plan your expenses wisely</p>
        </div>

        <div className="budget-categories">
          <div className="budget-card" data-aos="zoom-in">
            <GiMoneyStack className="budget-icon" />
            <h3>Entry & Permits</h3>
            <div className="budget-items">
              <div className="budget-item">
                <span>Entry Fee:</span>
                <span className="price">{destination.pricing?.entryFee || 'Free'}</span>
              </div>
              {destination.permits && destination.permits.length > 0 && (
                destination.permits.map((permit, index) => (
                  <div key={index} className="budget-item">
                    <span>{permit.name}:</span>
                    <span className="price">{permit.cost}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="budget-card" data-aos="zoom-in" data-aos-delay="100">
            <MdRestaurant className="budget-icon" />
            <h3>Food & Dining</h3>
            <div className="budget-items">
              <div className="budget-item">
                <span>Budget Meal:</span>
                <span className="price">₹150-300</span>
              </div>
              <div className="budget-item">
                <span>Mid-range:</span>
                <span className="price">₹500-1000</span>
              </div>
              <div className="budget-item">
                <span>Fine Dining:</span>
                <span className="price">₹1500+</span>
              </div>
            </div>
          </div>

          <div className="budget-card" data-aos="zoom-in" data-aos-delay="200">
            <MdHotel className="budget-icon" />
            <h3>Accommodation</h3>
            <div className="budget-items">
              <div className="budget-item">
                <span>Budget Stay:</span>
                <span className="price">₹800-1500/night</span>
              </div>
              <div className="budget-item">
                <span>Mid-range:</span>
                <span className="price">₹2500-5000/night</span>
              </div>
              <div className="budget-item">
                <span>Luxury:</span>
                <span className="price">₹8000+/night</span>
              </div>
            </div>
          </div>

          <div className="budget-card" data-aos="zoom-in" data-aos-delay="300">
            <MdLocalActivity className="budget-icon" />
            <h3>Activities</h3>
            <div className="budget-items">
              <div className="budget-item">
                <span>Per Activity:</span>
                <span className="price">₹500-2000</span>
              </div>
              <div className="budget-item">
                <span>Guided Tours:</span>
                <span className="price">₹1500-3500</span>
              </div>
              <div className="budget-item">
                <span>Equipment Rental:</span>
                <span className="price">₹300-1000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="budget-summary" data-aos="fade-up">
          <h3>Estimated Total Per Person</h3>
          <div className="budget-ranges">
            <div className="budget-range">
              <h4>Budget Traveler</h4>
              <p>₹2,000 - 4,000</p>
              <span>per day</span>
            </div>
            <div className="budget-range">
              <h4>Mid-range Traveler</h4>
              <p>₹5,000 - 10,000</p>
              <span>per day</span>
            </div>
            <div className="budget-range">
              <h4>Luxury Traveler</h4>
              <p>₹15,000+</p>
              <span>per day</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ====================================
// NEW: TIPS & RECOMMENDATIONS SECTION
// ====================================
const TipsRecommendationsSection = ({ destination }) => {
  const tips = [
    { icon: <FiClock />, title: 'Best Time to Visit', tip: destination.bestTimeToVisit?.description || 'Visit during October to March for pleasant weather.' },
    { icon: <MdSecurity />, title: 'Stay Safe', tip: 'Keep valuables secure, stay on marked trails, and follow local guidelines.' },
    { icon: <FiCamera />, title: 'Photography', tip: 'Early morning and late evening offer the best lighting. Respect privacy and ask before photographing people.' },
    { icon: <MdPeople />, title: 'Local Etiquette', tip:'Dress modestly, remove shoes at religious sites, and respect local customs and traditions.' },
    { icon: <FiHeart />, title: 'Sustainable Travel', tip: 'Carry reusable water bottles, avoid single-use plastics, and support local businesses.' },
    { icon: <MdRestaurant />, title: 'Food Tips', tip: 'Try local cuisine, drink bottled water, and eat at recommended places for authentic experience.' }
  ];

  return (
    <section className="tips-recommendations-section">
      <div className="container">
        <div className="section-header" data-aos="fade-up">
          <h2 className="section-title">
            <span className="title-accent">Tips</span> & Recommendations
          </h2>
          <p className="section-subtitle">Make the most of your visit</p>
        </div>

        <div className="tips-grid">
          {tips.map((item, index) => (
            <div key={index} className="tip-card" data-aos="flip-left" data-aos-delay={index * 50}>
              <div className="tip-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.tip}</p>
            </div>
          ))}
        </div>

        <div className="pro-tips" data-aos="fade-up">
          <h3>Pro Tips from Experienced Travelers</h3>
          <ul className="pro-tips-list">
            <li>Book accommodations in advance during peak season to get better deals.</li>
            <li>Hire local guides to learn hidden stories and get insider access.</li>
            <li>Carry a power bank, comfortable shoes, and weather-appropriate clothing.</li>
            <li>Download offline maps and save emergency contact numbers.</li>
            <li>Start your day early to avoid crowds and enjoy peaceful moments.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

// Main Component
const DestinationDetail = () => {
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    // Initialize AOS
    Aos.init({ 
      duration: 1000,
      once: true,
      offset: 100 
    });

    // Fetch destination data
    const fetchDestination = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/v1/destinations/${id}`);
        if (res.data && res.data.data) {
          setDestination(res.data.data);
        } else {
          throw new Error('Invalid data received from server');
        }
      } catch (error) {
        console.error('Error fetching destination:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDestination();
    }
  }, [id]);

  if (loading) return (
    <div className="loading-container">
      <Loader fullscreen />
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-content">
        <FiAlertCircle />
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <Link to="/destinations" className="btn-primary">
          Back to Destinations
        </Link>
      </div>
    </div>
  );

  if (!destination) return (
    <div className="not-found-container">
      <div className="not-found-content">
        <FiMapPin />
        <h2>Destination Not Found</h2>
        <p>The destination you're looking for doesn't exist.</p>
        <Link to="/destinations" className="btn-primary">
          Explore Destinations
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="destination-detail-page">
        <HeroSection destination={destination} />
        <QuickInfoSection destination={destination} />
        <AboutSection destination={destination} />
        <WeatherClimateSection destination={destination} />
        <ActivitiesSection destination={destination} />
        <CuisineSection destination={destination} />
        <TabbedInfoSection destination={destination} />
        <HealthSafetySection destination={destination} />
        <TravelGearSection destination={destination} />
        <TransportationSection destination={destination} />
        <BudgetPlanningSection destination={destination} />
        <TipsRecommendationsSection destination={destination} />
        <EducationalSection destination={destination} />
        <MapSection destination={destination} />
        <BookingCTASection destination={destination} />
      </div>
      <Footer />
    </>
  );
};

export default DestinationDetail;