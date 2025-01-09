// frontend/src/pages/MyProductsPage.js
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../contexts/AuthContext';
import './styles/MyProductsPage.css';
import { Edit, Trash2, Image } from 'lucide-react'; // Import icons

const MyProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authTokens } = useAuth();

  useEffect(() => {
    const fetchMyProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('marketplace/my-products/', {
          headers: { Authorization: `Bearer ${authTokens?.access}` },
        });
        setProducts(response.data.results);
      } catch (err) {
        setError(err.message || 'Failed to fetch your products.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyProducts();
  }, [authTokens]);

  const handleDeleteProduct = async (slug) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`marketplace/products/${slug}/`, {
          headers: { Authorization: `Bearer ${authTokens?.access}` },
        });
        setProducts(products.filter(product => product.slug !== slug));
      } catch (error) {
        console.error("Error deleting product:", error);
        setError("Failed to delete the product.");
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading your products...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="my-products-page">
      <header className="my-products-header">
        <h2>My Listed Products</h2>
        <Link to="/products/create/" className="button primary-button">
          List Another Product
        </Link>
      </header>

      {products.length === 0 && !loading ? (
        <div className="empty-products">
          <p>You haven't listed any products yet.</p>
          <Link to="/products/create/" className="button primary-button">
            List Your First Product
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.slug} className="product-card">
              <Link to={`/products/${product.slug}/`} className="product-link">
                <div className="product-image-container">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0].image}
                      alt={product.name}
                      className="product-image"
                    />
                  ) : (
                    <div className="no-image-placeholder">
                      <Image size={48} />
                      <span>No Image</span>
                    </div>
                  )}
                </div>
                <div className="product-details">
                  <h3>{product.name}</h3>
                  <p className="product-price">${product.price}</p>
                  <p className="product-stock">
                    Stock: {product.stock} {product.unit}
                  </p>
                  <p className="product-availability">
                    Availability: {product.is_available ? 'In Stock' : 'Out of Stock'}
                  </p>
                  <p className="product-description">{product.description}</p>
                </div>
              </Link>
              <div className="product-actions">
                <Link
                  to={`/products/edit/${product.slug}/`}
                  className="button secondary-button small-button"
                  title="Edit Product"
                >
                  <Edit size={16} /> Edit
                </Link>
                <button
                  onClick={() => handleDeleteProduct(product.slug)}
                  className="button danger-button small-button"
                  title="Delete Product"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;