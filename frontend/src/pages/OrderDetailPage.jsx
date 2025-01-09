// frontend/src/pages/OrderDetailPage.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const response = await api.get(`marketplace/orders/${orderId}/`, {
          headers: { Authorization: `Bearer ${authTokens.access}` },
        });
        setOrder(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch order details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, authTokens]);

  if (loading) {
    return <div className="loading">Loading order details...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return (
    <div className="order-detail-page">
      <h2>Order Details</h2>
      <p><strong>Order ID:</strong> {order.id}</p>
      <p><strong>Product:</strong> {order.product.name}</p>
      <p><strong>Quantity:</strong> {order.quantity}</p>
      <p><strong>Total Price:</strong> ${order.total_price}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p><strong>Order Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
      <p><strong>Buyer:</strong> {order.buyer.username}</p>
      <p><strong>Seller:</strong> {order.seller.username}</p>
      {/* Add more details as needed */}
    </div>
  );
};

export default OrderDetailPage;