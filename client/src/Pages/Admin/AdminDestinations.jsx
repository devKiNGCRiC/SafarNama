import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './AdminDestinations.css';

const AdminDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/destinations');
      setDestinations(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this destination?')) {
      try {
        await axios.delete(`http://localhost:5000/api/v1/destinations/${id}`);
        setDestinations(destinations.filter(dest => dest._id !== id));
      } catch (error) {
        console.error('Error deleting destination:', error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-destinations">
      <div className="header">
        <h1>Manage Destinations</h1>
        <Link to="/admin/destinations/new" className="add-button">
          Add New Destination
        </Link>
      </div>

      <div className="destinations-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Featured</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((dest) => (
              <tr key={dest._id}>
                <td>{dest.name}</td>
                <td>{dest.address}</td>
                <td>{dest.featured ? 'Yes' : 'No'}</td>
                <td className="actions">
                  <Link to={`/admin/destinations/edit/${dest._id}`} className="edit-button">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(dest._id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDestinations;