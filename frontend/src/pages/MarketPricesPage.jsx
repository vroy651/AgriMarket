// frontend/src/pages/MarketPricesPage.js
import  { useState} from 'react';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const MarketPricesPage = () => {
  const [commodity, setCommodity] = useState('');
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPrices(null);
    setLoading(true);

    if (!isLoggedIn) {
      setError('You must be logged in to view market prices.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/market-prices/', {
        params: { commodity },
      });
      setPrices(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch market prices.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="market-prices-page">
      <h2>Market Prices</h2>
      <form onSubmit={handleSubmit} className="market-prices-form">
        <div className="form-group">
          <label htmlFor="commodity">Commodity (Optional):</label>
          <input
            type="text"
            id="commodity"
            placeholder="e.g., Wheat, Corn"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
          />
        </div>
        <button type="submit" className="button primary" disabled={loading}>
          {loading ? 'Fetching Prices...' : 'Get Market Prices'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {prices && Object.keys(prices).length > 0 && (
        <div className="prices-display">
          <h3>Market Prices for {commodity || 'Various Commodities'}</h3>
          <ul>
            {Object.entries(prices).map(([item, price]) => (
              <li key={item}>
                {item}: ${price}
              </li>
            ))}
          </ul>
        </div>
      )}
      {prices && Object.keys(prices).length === 0 && !loading && (
        <p>No market prices found for the specified commodity.</p>
      )}
    </div>
  );
};

export default MarketPricesPage;