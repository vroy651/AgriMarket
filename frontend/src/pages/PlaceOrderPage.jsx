// frontend/src/pages/PlaceOrderPage.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const PlaceOrderPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authTokens } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`marketplace/products/${productId}/`);
        setProduct(response.data);
      } catch (err) {
        setError('Failed to fetch product details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleQuantityChange = (e) => {
    setQuantity(parseInt(e.target.value, 10) || 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post(`marketplace/products/${productId}/place-order/`, {
        quantity: quantity,
        product: parseInt(productId)
      }, {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      });

      if (response.status === 201) {
        navigate('api/v1/marketplace/orders/');
      } else {
        setError('Failed to place order.');
      }
    } catch (err) {
      setError(err.message || 'Failed to place order.');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading product details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  const totalPrice = product.price * quantity;

  return (
    <div className="place-order-page">
      <h2>Place Order for {product.name}</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="product-summary">
        <h3>Product Details</h3>
        <p>Name: {product.name}</p>
        <p>Price per unit: ${product.price}</p>
        <p>Stock available: {product.stock}</p>
      </div>
      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-group">
          <label htmlFor="quantity">Quantity:</label>
          <input
            type="number"
            id="quantity"
            value={quantity}
            min="1"
            max={product.stock}
            onChange={handleQuantityChange}
            required
          />
        </div>
        <div className="order-summary">
          <p>Total Price: ${totalPrice.toFixed(2)}</p>
        </div>
        <button type="submit" className="button primary">Confirm Order</button>
        <button type="button" onClick={() => navigate(`marketplace/products/${product.slug}/`)} className="button secondary">Cancel</button>
      </form>
    </div>
  );
};

export default PlaceOrderPage;