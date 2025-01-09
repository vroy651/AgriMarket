// frontend/src/pages/WeatherPage.js
import { useState } from 'react';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const WeatherPage = () => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWeatherData(null);
    setLoading(true);

    if (!isLoggedIn) {
      setError('You must be logged in to view weather data.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/weather/', {
        params: { latitude, longitude },
      });
      setWeatherData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="weather-page">
      <h2>Weather Information</h2>
      <form onSubmit={handleSubmit} className="weather-form">
        <div className="form-group">
          <label htmlFor="latitude">Latitude:</label>
          <input
            type="text"
            id="latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="longitude">Longitude:</label>
          <input
            type="text"
            id="longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Fetching Weather...' : 'Get Weather'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {weatherData && (
        <div className="weather-display">
          <h3>Current Weather</h3>
          <p>Condition: {weatherData.current.condition.text}</p>
          <img src={weatherData.current.condition.icon} alt="Weather Icon" />
          <p>Temperature: {weatherData.current.temp_c}°C</p>
          <p>Humidity: {weatherData.current.humidity}%</p>
          <p>Wind Speed: {weatherData.current.wind_kph} km/h</p>
        </div>
      )}
    </div>
  );
};

export default WeatherPage;