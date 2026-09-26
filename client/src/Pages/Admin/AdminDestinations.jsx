import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from '../../features/admin/components/AdminLayout';
import './AdminDestinations.css';
import { API_URL } from '../../config/api';

const AdminDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/destinations`);
      setDestinations(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Could not load the destinations');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this destination?')) {
      try {
        await axios.delete(`${API_URL}/api/v1/destinations/${id}`);
        setDestinations(destinations.filter(dest => dest._id !== id));
        toast.success('Destination deleted');
      } catch (error) {
        console.error('Error deleting destination:', error);
        toast.error(error.response?.data?.message || 'Could not delete the destination');
      }
    }
  };

  if (loading) return <AdminLayout title="Destinations"><div className="loading">Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
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
    </AdminLayout>
  );
};

export default AdminDestinations;
