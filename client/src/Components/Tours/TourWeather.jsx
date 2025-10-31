// src/Components/Tours/TourWeather.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Sun, Wind, Droplets } from 'lucide-react';
import './TourWeather.css';

const TourWeather = ({ tourDates, location }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Using OpenWeatherMap API (you'll need to get an API key)
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${location[1]}&lon=${location[0]}&appid=${process.env.REACT_APP_WEATHER_API_KEY}&units=metric`
        );

        setWeatherData(response.data);
      } catch (err) {
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchWeatherData();
    }
  }, [location]);

  const getWeatherIcon = (weatherCode) => {
    switch (weatherCode) {
      case 'Clear':
        return <Sun className="weather-icon" />;
      case 'Clouds':
        return <Cloud className="weather-icon" />;
      case 'Rain':
        return <Droplets className="weather-icon" />;
      default:
        return <Wind className="weather-icon" />;
    }
  };

  if (loading) return <div className="weather-loading">Loading weather data...</div>;
  if (error) return null;

  return (
    <div className="tour-weather">
      <h3>Weather Forecast</h3>
      <div className="weather-grid">
        {weatherData?.list.slice(0, 5).map((forecast, index) => (
          <div key={index} className="weather-card">
            <div className="weather-date">
              {new Date(forecast.dt * 1000).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            {getWeatherIcon(forecast.weather[0].main)}
            <div className="weather-temp">
              {Math.round(forecast.main.temp)}°C
            </div>
            <div className="weather-desc">
              {forecast.weather[0].description}
            </div>
            <div className="weather-details">
              <span>Humidity: {forecast.main.humidity}%</span>
              <span>Wind: {forecast.wind.speed} km/h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourWeather;