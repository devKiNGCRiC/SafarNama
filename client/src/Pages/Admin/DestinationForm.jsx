import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './DestinationForm.css';
import { API_URL } from '../../config/api';

const DestinationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    history: '',
    significance: '',
    images: [''],
    activities: [{ name: '', description: '', duration: '', image: '' }],
    cuisine: [{ name: '', description: '', image: '' }],
    featured: false
  });

  useEffect(() => {
    if (isEditMode) {
      fetchDestination();
    }
  }, [id]);

  const fetchDestination = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/destinations/${id}`);
      setFormData(res.data.data);
    } catch (error) {
      console.error('Error fetching destination:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/api/v1/destinations/${id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/v1/destinations`, formData);
      }
      navigate('/admin/destinations');
    } catch (error) {
      console.error('Error saving destination:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (index, field, subfield, value, arrayName) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      if (subfield) {
        newArray[index] = { ...newArray[index], [subfield]: value };
      } else {
        newArray[index] = value;
      }
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName, template) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], template]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="destination-form">
      <h1>{isEditMode ? 'Edit Destination' : 'Add New Destination'}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Address:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>History:</label>
          <textarea
            name="history"
            value={formData.history}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Significance:</label>
          <textarea
            name="significance"
            value={formData.significance}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Images:</label>
          {formData.images.map((image, index) => (
            <div key={index} className="array-item">
              <input
                type="text"
                value={image}
                onChange={(e) => handleArrayChange(index, null, null, e.target.value, 'images')}
                placeholder="Image URL"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('images', index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('images', '')}
            className="add-button"
          >
            Add Image
          </button>
        </div>

        <div className="form-group">
          <label>Activities:</label>
          {formData.activities.map((activity, index) => (
            <div key={index} className="array-item">
              <input
                type="text"
                value={activity.name}
                onChange={(e) => handleArrayChange(index, 'activities', 'name', e.target.value, 'activities')}
                placeholder="Activity Name"
              />
              <input
                type="text"
                value={activity.description}
                onChange={(e) => handleArrayChange(index, 'activities', 'description', e.target.value, 'activities')}
                placeholder="Description"
              />
              <input
                type="text"
                value={activity.duration}
                onChange={(e) => handleArrayChange(index, 'activities', 'duration', e.target.value, 'activities')}
                placeholder="Duration"
              />
              <input
                type="text"
                value={activity.image}
                onChange={(e) => handleArrayChange(index, 'activities', 'image', e.target.value, 'activities')}
                placeholder="Image URL"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('activities', index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('activities', { name: '', description: '', duration: '', image: '' })}
            className="add-button"
          >
            Add Activity
          </button>
        </div>

        <div className="form-group">
          <label>Cuisine:</label>
          {formData.cuisine.map((item, index) => (
            <div key={index} className="array-item">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleArrayChange(index, 'cuisine', 'name', e.target.value, 'cuisine')}
                placeholder="Cuisine Name"
              />
              <input
                type="text"
                value={item.description}
                onChange={(e) => handleArrayChange(index, 'cuisine', 'description', e.target.value, 'cuisine')}
                placeholder="Description"
              />
              <input
                type="text"
                value={item.image}
                onChange={(e) => handleArrayChange(index, 'cuisine', 'image', e.target.value, 'cuisine')}
                placeholder="Image URL"
              />
              <button
                type="button"
                onClick={() => removeArrayItem('cuisine', index)}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addArrayItem('cuisine', { name: '', description: '', image: '' })}
            className="add-button"
          >
            Add Cuisine
          </button>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="featured"
              checked={formData.featured}
              onChange={handleChange}
            />
            Featured Destination
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">
            {isEditMode ? 'Update Destination' : 'Create Destination'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DestinationForm;