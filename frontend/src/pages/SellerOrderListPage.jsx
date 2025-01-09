import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/SellerOrderListPage.css';
import {api} from '../api';
import { useAuth } from '../contexts/AuthContext';

const SellerOrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens, updateTokens, logout } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
        const response = await api.get('marketplace/seller-orders/', {
            headers: {
                'Authorization': `Bearer ${authTokens?.access}`,
            }
        });
        setOrders(response.data.results); // Updated data access
    } catch (err) {
      console.error('Fetch orders error:', err);
      if (err.response && err.response.status === 401) {
            const newAccessToken = await updateTokens();
            if (newAccessToken) {
                fetchOrders();
            } else {
                logout();
                toast.error("Session expired, Please log in again");
            }
        } else {
            setError(err.message || 'Failed to fetch orders');
            toast.error(err.message || 'Failed to fetch orders');
        }
    } finally {
        setLoading(false);
    }
  }, [authTokens, updateTokens, logout]);


 const handleConfirmOrder = async (orderId) => {
    try {
      await api.post(`marketplace/order/${orderId}/confirm/`,{},{
           headers: {
                    'Authorization': `Bearer ${authTokens?.access}`,
                }
      });
      toast.success('Order confirmed successfully');
      fetchOrders();
    } catch (err) {
        console.error('Confirm order error:', err);
        if(err.response && err.response.status === 401) {
          // if the token is expired, get a new one or log out
           const newAccessToken = await updateTokens();
            if (newAccessToken) {
                // Retry the request with new access token
               handleConfirmOrder(orderId);
            } else {
                logout();
                 toast.error("Session expired, Please log in again")
            }
        } else {
             toast.error(err.message || 'Failed to confirm order');
        }
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt("Please provide a reason for cancellation:");
    if (!reason) return;
    try {
      await api.post(`marketplace/order/${orderId}/cancel/`, { reason }, {
           headers: {
                    'Authorization': `Bearer ${authTokens?.access}`,
                }
      });
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err) {
        console.error('Cancel order error:', err);
        if(err.response && err.response.status === 401) {
          // if the token is expired, get a new one or log out
           const newAccessToken = await updateTokens();
           if (newAccessToken) {
               // Retry the request with new access token
               handleCancelOrder(orderId);
           } else {
               logout();
               toast.error("Session expired, Please log in again")
           }
        } else {
             toast.error(err.message || 'Failed to cancel order');
        }
    }
  };


  useEffect(() => {
    if(authTokens) {
        fetchOrders();
    }
  }, [fetchOrders, authTokens]); // authTokens here

   if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button
          className="btn btn-retry"
          onClick={() => {
            setError(null);
            setLoading(true);
             if(authTokens){
                fetchOrders();
             }
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="seller-order-page">
      <div className="page-header">
        <h2 className="page-title">Seller Orders</h2>
        <button
          className="btn btn-refresh"
          onClick={() => {
            setLoading(true);
             if(authTokens){
                fetchOrders();
             }
          }}
        >
          Refresh Orders
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Buyer</th>
                <th>Quantity</th>
                <th>Total Price</th>
                <th>Status</th>
                <th>Order Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order?.product?.name || 'N/A'}</td>
                  <td>{order?.buyer?.username || 'N/A'}</td>
                  <td>{order.quantity}</td>
                  <td>${order.total_price}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="action-buttons">
                    {order.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-confirm"
                          onClick={() => handleConfirmOrder(order.id)}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn btn-cancel"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                       <button
                        className="btn btn-cancel"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerOrderListPage;