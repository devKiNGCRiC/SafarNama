import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, GeoJSON, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './EcoMap.css';
import indiaGeoJSON from './india.json';

// Custom marker icon with shadow
const customIcon = new L.Icon({
    iconUrl: '/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [12, 41]
});

// Enhanced MapBoundsRestrictor component
const MapBoundsRestrictor = () => {
    const map = useMap();
    
    useEffect(() => {
        // Updated India bounds
        const southWest = L.latLng(6.4626999, 68.1097);
        const northEast = L.latLng(37.097, 97.4152);
        const bounds = L.latLngBounds(southWest, northEast);
        
        map.setMaxBounds(bounds);
        map.setMinZoom(4);
        map.setMaxZoom(12);
        
        // Initial center position
        const center = [20.5937, 78.9629];
        map.setView(center, 5);
        
        // Smooth pan animation when reaching bounds
        map.on('drag', () => {
            map.panInsideBounds(bounds, { animate: true, duration: 0.5 });
        });

        // Disable keyboard navigation for better control
        map.keyboard.disable();
        
        return () => {
            map.off('drag');
            map.setMaxBounds(null);
            map.keyboard.enable();
        };
    }, [map]);
    
    return null;
};

const EcoMap = () => {
    const [destinations, setDestinations] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const [hoveredState, setHoveredState] = useState(null);
    const navigate = useNavigate();
    
    const categories = ['All', 'Mountain', 'Nature', 'Park', 'Beach', 'Recommended'];

    const handleCategoryChange = (category) => setSelectedCategory(category);

    // Enhanced GeoJSON styling
    const getGeoJSONStyle = (feature) => ({
        fillColor: hoveredState === feature.properties.name ? '#e3e3e3' : '#f8f8f8',
        weight: 2,
        opacity: 1,
        color: '#404040',
        fillOpacity: 0.3,
        dashArray: '',
        lineCap: 'round',
        lineJoin: 'round'
    });

    // Enhanced hover effects for GeoJSON
    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                setHoveredState(feature.properties.name);
                layer.setStyle({
                    weight: 3,
                    color: '#666',
                    fillOpacity: 0.5,
                    fillColor: '#e3e3e3'
                });
                layer.bringToFront();
            },
            mouseout: (e) => {
                const layer = e.target;
                setHoveredState(null);
                layer.setStyle(getGeoJSONStyle(feature));
            },
            click: (e) => {
                // `map` is not in scope here; the clicked layer knows its map
                e.target._map?.fitBounds(e.target.getBounds());
            }
        });
    };

    // Custom map controls component
    const MapControls = () => {
        const map = useMap();

        const handleResetView = () => {
            map.setView([20.5937, 78.9629], 5, { animate: true });
        };

        return (
            <div className="map-custom-controls">
                <button 
                    className="reset-view-btn"
                    onClick={handleResetView}
                    title="Reset map view"
                >
                    <span>🎯</span>
                </button>
            </div>
        );
    };

    return (
        <div className="eco-map-section">
            {loading && (
                <div className="map-loading">
                    <div className="loader"></div>
                    <p>Loading destinations...</p>
                </div>
            )}
            
            <div className="map-filters">
                <div className="category-filters">
                    {categories.map((category) => (
                        <button
                            key={category}
                            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => handleCategoryChange(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                className="map-container"
                zoomControl={false}
                maxBoundsViscosity={1.0}
                wheelDebounceTime={100}
                wheelPxPerZoomLevel={150}
                doubleClickZoom={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    bounds={[
                        [6.4626999, 68.1097],
                        [37.097, 97.4152]
                    ]}
                    noWrap={true}
                    className="custom-tile-layer"
                />
                
                <GeoJSON 
                    data={indiaGeoJSON} 
                    style={getGeoJSONStyle}
                    onEachFeature={onEachFeature}
                />
                
                <MapBoundsRestrictor />
                <MapControls />
                <ZoomControl position="bottomright" />

                {destinations.map((destination) => (
                    <Marker
                        key={destination._id}
                        position={[
                            destination.location.coordinates[1],
                            destination.location.coordinates[0]
                        ]}
                        icon={customIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="destination-popup">
                                <div className="popup-image-container">
                                    <img 
                                        src={destination.images[0]} 
                                        alt={destination.name}
                                        className="popup-image"
                                    />
                                </div>
                                <div className="popup-content">
                                    <h3>{destination.name}</h3>
                                    <p className="address">{destination.address}</p>
                                    <div className="rating">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`star ${i < Math.floor(destination.rating) ? 'filled' : ''}`}>
                                                ★
                                            </span>
                                        ))}
                                        <span className="rating-number">({destination.rating})</span>
                                    </div>
                                    <button
                                        className="view-details-btn"
                                        onClick={() => navigate(`/destination/${destination._id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default EcoMap;