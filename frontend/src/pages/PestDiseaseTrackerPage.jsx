// frontend/src/pages/PestDiseaseTrackerPage.js
import { useState } from 'react';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const PestDiseaseTrackerPage = () => {
  const [soilImage, setSoilImage] = useState(null);
  const [leafImage, setLeafImage] = useState(null);
  const [predictionResults, setPredictionResults] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, authTokens } = useAuth();

  const handleSoilImageChange = (e) => {
    setSoilImage(e.target.files[0]);
    setPredictionResults(null);
  };

  const handleLeafImageChange = (e) => {
    setLeafImage(e.target.files[0]);
    setPredictionResults(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPredictionResults(null);
    setLoading(true);

    if (!isLoggedIn) {
      setError('You must be logged in to use the pest and disease tracker.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (soilImage) formData.append('soilImage', soilImage);
    if (leafImage) formData.append('leafImage', leafImage);

    try {
      const response = await api.post('/pest-disease-tracker/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authTokens.access}`,
        },
      });
      setPredictionResults(response.data.prediction_results);
    } catch (err) {
      setError(err.message || 'Failed to analyze images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pest-disease-tracker-page">
      <h2>Pest and Disease Tracker</h2>
      <form onSubmit={handleSubmit} className="pest-tracker-form">
        <div className="form-group">
          <label htmlFor="soilImage">Soil Image:</label>
          <input type="file" id="soilImage" accept="image/*" onChange={handleSoilImageChange} />
        </div>
        <div className="form-group">
          <label htmlFor="leafImage">Leaf Image:</label>
          <input type="file" id="leafImage" accept="image/*" onChange={handleLeafImageChange} />
        </div>
        <button type="submit" className="button primary" disabled={loading || (!soilImage && !leafImage)}>
          {loading ? 'Analyzing...' : 'Analyze Images'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {predictionResults && (
        <div className="prediction-results">
          <h3>Analysis Results:</h3>
          <p>{predictionResults}</p>
        </div>
      )}
    </div>
  );
};

export default PestDiseaseTrackerPage;