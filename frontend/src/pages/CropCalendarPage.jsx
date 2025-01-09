// frontend/src/pages/CropCalendarPage.js
import { useState } from 'react';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const CropCalendarPage = () => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [month, setMonth] = useState('');
  const [calendarData, setCalendarData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCalendarData(null);
    setLoading(true);

    if (!isLoggedIn) {
      setError('You must be logged in to view crop calendar data.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/crop-calendar/', {
        params: { latitude, longitude, month },
      });
      setCalendarData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch crop calendar data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crop-calendar-page">
      <h2>Crop Calendar and Recommendations</h2>
      <form onSubmit={handleSubmit} className="crop-calendar-form">
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
        <div className="form-group">
          <label htmlFor="month">Month (Optional):</label>
          <input
            type="number"
            id="month"
            min="1"
            max="12"
            placeholder="Current month if empty"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Fetching Calendar...' : 'Get Crop Calendar'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {calendarData && (
        <div className="calendar-display">
          <h3>Crop Recommendations for {calendarData.season}</h3>
          <p>Month: {calendarData.month}</p>
          <ul>
            {calendarData.recommended_crops.map((crop, index) => (
              <li key={index}>{crop}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CropCalendarPage;