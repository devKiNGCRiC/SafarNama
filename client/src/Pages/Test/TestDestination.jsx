

import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';


const testDestination = {
    name: "Mount Everest Base Camp",
    address: "Solukhumbu District, Nepal",
    description: "The gateway to the world's highest peak, offering stunning Himalayan views.",
    history: "First established in 1953 during the first successful Everest expedition.",
    significance: "Serves as the starting point for Everest summit attempts and a popular trekking destination.",
    images: [
      "https://example.com/basecamp1.jpg",
      "https://example.com/basecamp2.jpg",
      "https://example.com/basecamp3.jpg"
    ],
    activities: [
      {
        name: "Trekking",
        description: "Multi-day trek to base camp",
        duration: "12-14 days",
        image: "https://example.com/trekking.jpg"
      },
      {
        name: "Photography",
        description: "Capture stunning mountain vistas",
        duration: "Any time",
        image: "https://example.com/photography.jpg"
      }
    ],
    cuisine: [
      {
        name: "Dal Bhat",
        description: "Traditional Nepali rice and lentil dish",
        image: "https://example.com/dalbhat.jpg"
      },
      {
        name: "Sherpa Stew",
        description: "Hearty mountain soup",
        image: "https://example.com/sherpastew.jpg"
      }
    ],
    featured: true
  };
const TestDestination = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const createTestDestination = async () => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/api/v1/destinations`, testDestination);
      setResponse(res.data);
      alert('Destination created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      alert('Error creating destination');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Destination Creation</h2>
      <button 
        onClick={createTestDestination}
        style={{
          padding: '10px 20px',
          background: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Create Test Destination
      </button>

      {error && (
        <div style={{ marginTop: '20px', color: 'red' }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px' }}>
          <h3>Success Response:</h3>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestDestination;