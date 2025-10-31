import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DestinationDetail.css';
import Navbar from '../../Components/Navbar/Navbar';
import Sidebar from '../../Components/Sidebar/Sidebar';
import Footer from '../../Components/Footer/Footer';
import Loader from '../../Components/Loader/Loader';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PermitsSection = ({ destination }) => {
  // Check if permits exist and is an array
  if (!destination?.permits || !Array.isArray(destination.permits) || destination.permits.length === 0) {
    return (
      <div className="permits-section">
        <h3>Required Permits</h3>
        <p className="no-permits">No permit information available</p>
      </div>
    );
  }

  return (
    <div className="permits-section">
      <h3>Required Permits</h3>
      <div className="permits-grid">
        {destination.permits.map((permit, index) => (
          <div key={index} className="permit-card">
            <h4>{permit.name || 'Unnamed Permit'}</h4>
            <p className="permit-cost">Cost: {permit.cost || 'Not specified'}</p>
            <p className="permit-validity">Valid for: {permit.validityPeriod || 'Not specified'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
const Overview = ({ destination }) => {
  if (!destination) return null;

  return (
    <div className="overview-section">
      <div className="info-grid">
        <div className="info-card">
          <h3>Visit Duration & Timing</h3>
          <div className="info-details">
            <p>
              <span>Average Stay:</span> 
              {destination.stats?.averageStayDuration || 'Not specified'}
            </p>
            <p>
              <span>Peak Hours:</span> 
              {destination.stats?.peakHours?.join(', ') || 'Not specified'}
            </p>
            <p>
              <span>Quiet Hours:</span> 
              {destination.stats?.quietHours?.join(', ') || 'Not specified'}
            </p>
          </div>
        </div>

        <div className="info-card">
          <h3>Accessibility</h3>
          <div className="info-details">
            <p>
              <span>Wheelchair Accessible:</span>
              {destination.accessibility?.wheelchairAccessible ? 'Yes' : 'No'}
            </p>
            <p>
              <span>Public Transport:</span>
              {destination.accessibility?.publicTransport ? 'Available' : 'Not Available'}
            </p>
            <p>
              <span>Parking:</span>
              {destination.accessibility?.parkingAvailable ? 'Available' : 'Not Available'}
            </p>
          </div>
        </div>
      </div>
      {/* Add the PermitsSection component */}
      <PermitsSection destination={destination} />
    </div>
  );
};

const RelatedContent = ({ destination }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if destination is already saved when component mounts
    const checkIfSaved = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(
          `http://localhost:5000/api/v1/users/saved-destinations/check/${destination._id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setIsSaved(response.data.isSaved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkIfSaved();
  }, [destination._id]);

  const handleSaveDestination = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to save destinations');
        return;
      }

      setLoading(true);
      const response = await axios.post(
        `http://localhost:5000/api/v1/users/saved-destinations/${destination._id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setIsSaved(true);
        alert('Destination saved successfully!');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving destination');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="related-content-section">
      <div className="related-content-grid">
        {/* Save Destination Card */}
        {/* <div className="feature-card save-destination">
          <div className="card-content">
            <h3>Save for Later</h3>
            <p>Like this destination? Save it to your profile for quick access.</p>
            <button 
              onClick={handleSaveDestination} 
              disabled={loading || isSaved}
              className="save-btn"
            >
              {isSaved ? 'Saved ✓' : 'Save Destination'}
            </button>
          </div>
        </div> */}

        {/* Eco Guides Preview Card */}
        {/* <div className="feature-card eco-guides">
          <div className="card-content">
            <h3>Eco Tourism Guides</h3>
            <p>Discover eco-friendly tips and best practices for this destination.</p>
            <Link to={`/eco-guides?destination=${destination._id}`} className="feature-link">
              View Guides
            </Link>
          </div>
        </div> */}

        {/* Events Preview Card */}
        {/* <div className="feature-card events">
          <div className="card-content">
            <h3>Upcoming Events</h3>
            <p>Check out eco-tourism events happening at this location.</p>
            <Link to={`/events?location=${destination._id}`} className="feature-link">
              View Events
            </Link>
          </div>
        </div> */}

        {/* Itinerary Builder Card */}
        <div className="feature-card itinerary">
          <div className="card-content">
            <h3>Create Itinerary</h3>
            <p>Plan your visit by creating a custom eco-friendly itinerary.</p>
            <Link 
              to={`/itinerary?destination=${destination._id}`} 
              className="feature-link"
            >
              Build Itinerary
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const DestinationDetail = () => {
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/destinations/${id}`);
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
      <div className="loading">Loading destination details...<Loader fullscreen/></div>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error">Error: {error}</div>
    </div>
  );

  if (!destination) return (
    <div className="not-found-container">
      <div className="not-found">Destination not found</div>
    </div>
  );
  

  // Convert coordinates to [lat, lng] format for Leaflet
  const mapPosition = destination.location?.coordinates?.length === 2 
    ? [destination.location.coordinates[1], destination.location.coordinates[0]]
    : [0, 0];

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="destination-detail">
        <h1 className='dtitle'>{destination.name}</h1>
        <p className="address">{destination.address}</p>

        <div className="info-section">
          <div className="content-block">
            <div className="text-content">
              <h2 className='about'>About</h2>
              <p className='dDetails'>{destination.description}</p>
            </div>
            <div className="image-content">
              {destination.images?.[0] && (
                <img 
                  src={destination.images[0]} 
                  alt={destination.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/path/to/fallback/image.jpg'; // Add your fallback image path
                  }}
                />
              )}
              {/* <img src={destination.images[0]} alt={destination.name} /> */}
            </div>
          </div>


          {/* {destination.history && (
            <div className="content-block reverse">
              <div className="text-content">
                <h2>History</h2>
                <p>{destination.history}</p>
              </div>
              <div className="image-content">
                {destination.images?.[1] && (
                  <img 
                    src={destination.images[1]} 
                    alt={`${destination.name} history`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/path/to/fallback/image.jpg';
                    }}
                  />
                )}
              </div>
            </div>
          )} */}
          <div className="content-block reverse">
            <div className="text-content">
              <h2 className='about'>History</h2>
              <p className='dDetails'>{destination.history}</p>
            </div>
            <div className="image-content">
              <img src={destination.images[1]} alt={`${destination.name} history`} />
            </div>
          </div>

            {/* {destination.significance && (
              <div className="content-block">
                <div className="text-content">
                  <h2>Significance</h2>
                  <p>{destination.significance}</p>
                </div>
                <div className="image-content">
                  {destination.images?.[2] && (
                    <img 
                      src={destination.images[2]} 
                      alt={`${destination.name} significance`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/path/to/fallback/image.jpg';
                      }}
                    />
                  )}
                </div>
              </div>
            )} */}
          <div className="content-block">
            <div className="text-content">
              <h2 className='about'>Significance</h2>
              <p className='dDetails'>{destination.significance}</p>
            </div>
            <div className="image-content">
              <img src={destination.images[2]} alt={`${destination.name} significance`} />
            </div>
          </div>
        </div>

        {/* {destination.activities?.length > 0 && (
          <section className="activities-section">
            <h2>Activities</h2>
            <div className="activities-grid">
              {destination.activities.map((activity, index) => (
                <div key={index} className="activity-card">
                  {activity.image && (
                    <img src={activity.image} alt={activity.name} />
                  )}
                  <h3>{activity.name}</h3>
                  <p>{activity.description}</p>
                  <span className="duration">{activity.duration}</span>
                </div>
              ))}
            </div>
          </section>
        )} */}

        <section className="activities-section">
          <h2>Activities</h2>
          <div className="activities-grid">
            {destination.activities.map((activity, index) => (
              <div key={index} className="activity-card">
                <img src={activity.image} alt={activity.name} />
                <h3>{activity.name}</h3>
                <p>{activity.description}</p>
                <span className="duration">Duration: {activity.duration}</span>
              </div>
            ))}
          </div>
        </section>

        {/* {destination.cuisine?.length > 0 && (
          <section className="cuisine-section">
            <h2>Local Cuisine</h2>
            <div className="cuisine-grid">
              {destination.cuisine.map((item, index) => (
                <div key={index} className="cuisine-card">
                  {item.image && (
                    <img src={item.image} alt={item.name} />
                  )}
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        )} */}

        <section className="cuisine-section">
          <h2>Local Cuisine</h2>
          <div className="cuisine-grid">
            {destination.cuisine.map((item, index) => (
              <div key={index} className="cuisine-card">
                <img src={item.image} alt={item.name} />
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="new-sections-container">
          {/* Tab Navigation */}
          <div className="tabs-navigation">
            <button 
              className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`tab-button ${activeTab === 'sustainability' ? 'active' : ''}`}
              onClick={() => setActiveTab('sustainability')}
            >
              Sustainability
            </button>
            <button 
              className={`tab-button ${activeTab === 'seasonal' ? 'active' : ''}`}
              onClick={() => setActiveTab('seasonal')}
            >
              Seasonal Info
            </button>
            <button 
              className={`tab-button ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              Local Community
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
          {activeTab === 'overview' && <Overview destination={destination} />}

            {activeTab === 'sustainability' && (
              <div className="sustainability-section">
                <div className="initiatives-container">
                  {destination.sustainabilityInitiatives.map((initiative, index) => (
                    <div key={index} className="initiative-card">
                      <h4>{initiative.name}</h4>
                      <p className="initiative-description">{initiative.description}</p>
                      <p className="initiative-impact">Impact: {initiative.impact}</p>
                      <div className="participation-guide">
                        <h5>How to Participate:</h5>
                        <p>{initiative.howToParticipate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'seasonal' && (
              <div className="seasonal-section">
                <div className="season-grid">
                  <div className="season-card">
                    <h3>Peak Season</h3>
                    <div className="season-details">
                      <p><span>Months:</span> {destination.seasonality.peakSeason.months.join(', ')}</p>
                      <p><span>Pricing:</span> {destination.seasonality.peakSeason.pricing}</p>
                      <div className="advantages">
                        <h4>Advantages:</h4>
                        <ul>
                          {destination.seasonality.peakSeason.advantages.map((adv, i) => (
                            <li key={i}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="season-card">
                    <h3>Off Season</h3>
                    <div className="season-details">
                      <p><span>Months:</span> {destination.seasonality.offSeason.months.join(', ')}</p>
                      <p><span>Pricing:</span> {destination.seasonality.offSeason.pricing}</p>
                      <div className="advantages">
                        <h4>Advantages:</h4>
                        <ul>
                          {destination.seasonality.offSeason.advantages.map((adv, i) => (
                            <li key={i}>{adv}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="weather-section">
                  <h3>Weather Information</h3>
                  <div className="weather-grid">
                    {Object.entries(destination.weather.averageTemperature).map(([season, temp]) => (
                      <div key={season} className="weather-card">
                        <h4>{season}</h4>
                        <p>{temp}</p>
                      </div>
                    ))}
                  </div>
                  <div className="weather-details">
                    <p><span>Climate:</span> {destination.weather.climate}</p>
                    <p><span>Rainfall Pattern:</span> {destination.weather.rainfallPattern}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'community' && (
              <div className="community-section">
                <div className="traditions-container">
                  <h3>Local Traditions</h3>
                  <ul className="traditions-list">
                    {destination.localCommunity.traditions.map((tradition, index) => (
                      <li key={index}>{tradition}</li>
                    ))}
                  </ul>
                </div>

                <div className="local-businesses">
                  <h3>Local Businesses</h3>
                  <div className="business-grid">
                    {destination.localCommunity.localBusinesses.map((business, index) => (
                      <div key={index} className="business-card">
                        <div className="business-header">
                          <h4>{business.name}</h4>
                          {business.sustainable && (
                            <span className="eco-friendly-badge">Eco-Friendly</span>
                          )}
                        </div>
                        <p className="business-type">{business.type}</p>
                        <p className="business-description">{business.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Map Section */}
        {destination.location?.coordinates && (
          <section className="map-section">
            <h2>Location Map</h2>
            <div className="map-container">
              <MapContainer 
                center={mapPosition}
                zoom={13} 
                className="map"
                style={{ height: '400px', width: '100%' }}
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
          </section>
        )}

        {/* <section className="map-section">
        <h2>Location Map</h2>
        <div className="map-container">
          <MapContainer 
            center={mapPosition}
            zoom={13} 
            className="map"
            style={{ height: '400px', width: '100%' }}
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
      </section> */}

        {/* New Health & Safety Section */}
        <section className="health-safety-section">
          <h2>Health & Safety Guidelines</h2>
          <div className="guidelines-grid">
            <div className="guidelines-list">
              {destination.healthSafety.guidelines.map((guideline, index) => (
                <div key={index} className="guideline-item">
                  <span className="bullet">•</span>
                  <p>{guideline}</p>
                </div>
              ))}
            </div>
            
            <div className="emergency-contacts">
              <h3>Emergency Contacts</h3>
              <div className="contacts-list">
                {destination.healthSafety.emergencyContacts.map((contact, index) => (
                  <div key={index} className="contact-card">
                    <p>Name: {contact.name}</p>
                    <p>Number: {contact.number}</p>
                    <p>Type: {contact.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* <section className="health-safety-section">
          <h2>Health & Safety Guidelines</h2>
          <div className="guidelines-grid">
            <div className="guidelines-list">
              {destination.healthSafety.guidelines.map((guideline, index) => (
                <div key={index} className="guideline-item">
                  <span className="bullet">•</span>
                  <p>{guideline}</p>
                </div>
              ))}
            </div>
            
            <div className="emergency-contacts">
              <h3>Emergency Contacts</h3>
              {destination.healthSafety.emergencyContacts.map((contact, index) => (
                <div key={index} className="contact-card">
                  <h4>{contact.name}</h4>
                  <p>{contact.type}</p>
                  <a href={`tel:${contact.number}`}>{contact.number}</a>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        {/* New Travel Gear Section */}
        <section className="travel-gear-section">
          <h2>Recommended Travel Gear</h2>
          <div className="gear-categories">
            {destination.travelGear.map((category, index) => (
              <div key={index} className="gear-category">
                <h3>{category.category}</h3>
                <div className="gear-items">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="gear-item">
                      <h4>{item.name}</h4>
                      <span className="importance-tag">{item.importance}</span>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* New Educational Resources Section */}
        <section className="educational-section">
          <h2>Educational Resources</h2>
          <div className="resources-grid">
            {destination.educationalResources.map((resource, index) => (
              <div key={index} className="resource-card">
                <h3>{resource.title}</h3>
                <span className="resource-type">{resource.type}</span>
                <p>{resource.description}</p>
                {resource.link && (
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                    Learn More
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
        {/* <section className="educational-section">
          <h2>Educational Resources</h2>
          <div className="resources-grid">
            {destination.educationalResources.map((resource, index) => (
              <div key={index} className="resource-card">
                <h3>{resource.title}</h3>
                <span className="resource-type">{resource.type}</span>
                <p>{resource.description}</p>
                {resource.link && (
                  <a href={resource.link} target="_blank" rel="noopener noreferrer" className="resource-link">
                    Learn More
                  </a>
                )}
              </div>
            ))}
          </div>
        </section> */}

        <div className="booking-section">
          <div className="booking-card">
            <h2>Ready to Experience {destination.name}?</h2>
            <p>Book your eco-friendly tour now and create unforgettable memories!</p>
            <Link 
              to="/booking" 
              state={{ destinationId: destination._id }} // Pass destination ID
              className="booking-button"
            >
              View Available Tours
            </Link>
          </div>
        </div>
      </div>
      <RelatedContent destination={destination} />
      <Footer />
    </>
  );
};

export default DestinationDetail;